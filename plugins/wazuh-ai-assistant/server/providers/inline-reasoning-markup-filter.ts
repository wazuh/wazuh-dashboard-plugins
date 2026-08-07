/**
 * Server-side, model-agnostic backstop against reasoning models that inline their
 * chain-of-thought (or a failed attempt at a structured tool call) as literal TEXT in
 * `delta.content`, instead of on the dedicated `delta.reasoning` channel that
 * openai-compatible.ts's `reasoningFallback` already handles (see issue
 * 02-read-reasoning-delta.md). Measured on `qwen/qwen3.6-27b`: 6 of 8 successful answers leaked
 * this markup into the user's answer bubble (issue 18-strip-inline-reasoning-markup.md). Verbatim
 * example (a real captured answer):
 *
 *   <think>
 *   The user wants to know the RAM and CPU of "this host" ...
 *   </think>
 *
 *   <tool_call>
 *   <function=search_wazuh_data>
 *   <parameter=index_pattern>
 *   wazuh-states-*
 *   </parameter>
 *
 * (that example's `<tool_call>` block is itself unclosed -- the stream simply ended mid-call.)
 * `openai/gpt-oss-120b` never emits any of this (it uses the separate reasoning channel), so this
 * filter must be a byte-identical no-op on that model's output.
 *
 * Same shape as server/tools/markdown-table-filter.ts (read that file's doc comment first): a tag
 * can straddle two SSE chunk boundaries, so a naive per-chunk regex would miss it. That file
 * solves the streaming problem by buffering whole LINES; this one buffers a small MARGIN instead
 * (closer to server/tools/privacy.ts's `StreamDepseudonymizer`), because reasoning markup is not
 * line-oriented -- a `<think>` block can open and close mid-line, and its body is arbitrary
 * multi-paragraph prose with no delimiter of its own.
 *
 * Deliberately narrow, per the issue's "prefer explicit known tag names over a generic
 * `<[^>]+>` sweep" instruction: only the four known tag families below are ever treated as
 * markup. A legitimate answer mentioning `<script>` or comparing `size < 500` is untouched --
 * neither is a prefix of any recognized tag, so both fall straight through as plain text.
 */

/** Tag families this filter recognizes as reasoning/tool-call-as-text markup, never as prose. */
const OPEN_TAG_RE =
  /<think>|<tool_call>|<function(?:=[^<>]*)?>|<parameter(?:=[^<>]*)?>/;
const CLOSE_TAG_RE = /<\/think>|<\/tool_call>|<\/function>|<\/parameter>/;

/** Fixed-text tag keywords (no `=name` suffix) whose PREFIXES must be recognized at a buffer's
 * trailing edge so a tag split across two `push()` calls (e.g. "<thi" + "nk>") is never emitted
 * as if it were plain text. `function`/`parameter` are handled separately below since their
 * suffix (`=name`) is unbounded. */
const FIXED_KEYWORDS = [
  'think',
  'tool_call',
  '/think',
  '/tool_call',
  '/function',
  '/parameter',
];

/** True when `tail` (the buffer content strictly after the LAST unresolved '<') is consistent
 * with being the start of one of the recognized tags -- i.e. more input could still turn it into
 * a real match. Used only when `tail` contains no '>' yet (see `findPartialTagStart`); once a
 * '>' has arrived the tag is already fully resolved one way or the other, matched or not. */
function isPossibleTagPrefix(tail: string): boolean {
  if (FIXED_KEYWORDS.some(keyword => keyword.startsWith(tail))) {
    return true;
  }
  return /^function(=.*)?$/.test(tail) || /^parameter(=.*)?$/.test(tail);
}

/** Finds the index of a trailing '<' whose tag is still ambiguous (no closing '>' seen yet, and
 * what follows so far could still become a recognized tag) -- text from that index onward must be
 * held back rather than emitted, since the next `push()` might complete it into markup. Returns
 * -1 when nothing in the buffer needs holding back (no trailing '<', or the last one is already
 * resolved -- either fully closed or definitively not a match, e.g. "size < 500"). */
function findPartialTagStart(buffer: string): number {
  const lastOpenBracket = buffer.lastIndexOf('<');
  if (lastOpenBracket === -1) {
    return -1;
  }
  const tail = buffer.slice(lastOpenBracket + 1);
  if (tail.includes('>')) {
    return -1; // Already a complete bracketed span, tag or not -- nothing pending here.
  }
  return isPossibleTagPrefix(tail) ? lastOpenBracket : -1;
}

/** The earlier of an open-tag and a close-tag match within `buffer`, or `null` if neither is
 * present. Ties (same index) resolve to the open tag; the two patterns can never actually overlap
 * at the same position since one starts with '<x' and the other with '<\/x' from the same set of
 * keywords, so this is a formality rather than a real ambiguity. */
function nextTagMatch(
  buffer: string,
): { index: number; length: number; isOpen: boolean } | null {
  const openMatch = OPEN_TAG_RE.exec(buffer);
  const closeMatch = CLOSE_TAG_RE.exec(buffer);
  if (!openMatch && !closeMatch) {
    return null;
  }
  if (openMatch && (!closeMatch || openMatch.index <= closeMatch.index)) {
    return {
      index: openMatch.index,
      length: openMatch[0].length,
      isOpen: true,
    };
  }
  return {
    index: (closeMatch as RegExpExecArray).index,
    length: (closeMatch as RegExpExecArray)[0].length,
    isOpen: false,
  };
}

/**
 * Stateful, streaming-safe suppressor for inline reasoning/tool-call markup. Depth-tracked rather
 * than line-buffered (contrast `MarkdownTableSuppressor`): a `<think>` block, and the
 * `<tool_call><function=...><parameter=...>` markup that often follows it, can nest, and each
 * layer must stay suppressed until ITS OWN closer (or end of stream) is seen.
 *
 * `depth` counts how many recognized tags are currently open (0 = ordinary passthrough text).
 * Any of the four open-tag patterns increments it; any of the four close-tag patterns decrements
 * it (never below 0 -- a stray, never-opened closing tag is not an error worth failing on). Text
 * seen while `depth > 0` is dropped, never emitted.
 *
 * An unclosed block (depth never returns to 0 before the stream ends) is suppressed all the way
 * to end of stream, per the issue's explicit requirement -- `flush()` simply never releases text
 * that was accumulated while `depth > 0`.
 */
export class InlineReasoningMarkupFilter {
  private buffer = '';
  private depth = 0;
  private stripped = false;

  /** True once this filter has dropped at least one character of markup (this call or a previous
   * one) -- the adapter logs at debug on this, see openai-compatible.ts. */
  get didStrip(): boolean {
    return this.stripped;
  }

  /** Feeds one delta chunk (of any size, possibly mid-tag); returns the portion now safe to emit
   * as ordinary answer text. May return '' when the whole chunk was consumed by an in-progress
   * suppressed block or held back as an ambiguous tag prefix -- nothing is lost, it will resolve
   * on a later `push()` or on `flush()`. */
  push(chunk: string): string {
    this.buffer += chunk;
    return this.drain(false);
  }

  /** Releases whatever can still be resolved once the underlying stream has ended. Any buffered
   * text that was pending only because it MIGHT have become a tag is released as plain text (it
   * never will now); any buffered text that was already inside an unclosed suppressed block is
   * dropped for good -- that is precisely the "unclosed `<think>` runs to end of stream" case.
   * Safe to call more than once (returns '' after the first call). */
  flush(): string {
    const out = this.drain(true);
    this.buffer = '';
    return out;
  }

  private drain(isFinal: boolean): string {
    let out = '';
    while (true) {
      if (this.depth === 0) {
        const openMatch = OPEN_TAG_RE.exec(this.buffer);
        if (openMatch) {
          out += this.buffer.slice(0, openMatch.index);
          this.buffer = this.buffer.slice(
            openMatch.index + openMatch[0].length,
          );
          this.depth = 1;
          this.stripped = true;
          continue;
        }
        if (isFinal) {
          // Nothing more will ever arrive: even a dangling "<thi" can't complete into a tag now.
          out += this.buffer;
          this.buffer = '';
          break;
        }
        const holdFrom = findPartialTagStart(this.buffer);
        if (holdFrom === -1) {
          out += this.buffer;
          this.buffer = '';
        } else {
          out += this.buffer.slice(0, holdFrom);
          this.buffer = this.buffer.slice(holdFrom);
        }
        break;
      }

      // depth > 0: everything up to the next tag (open or close) is suppressed text.
      const next = nextTagMatch(this.buffer);
      if (next) {
        this.buffer = this.buffer.slice(next.index + next.length);
        this.depth = next.isOpen ? this.depth + 1 : Math.max(0, this.depth - 1);
        this.stripped = true;
        continue;
      }
      if (isFinal) {
        this.buffer = ''; // Unclosed block runs to end of stream -- dropped, per the issue.
        break;
      }
      const holdFrom = findPartialTagStart(this.buffer);
      this.buffer = holdFrom === -1 ? '' : this.buffer.slice(holdFrom);
      break;
    }
    return out;
  }
}
