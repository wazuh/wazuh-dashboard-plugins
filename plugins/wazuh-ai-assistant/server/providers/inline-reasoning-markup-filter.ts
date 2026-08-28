/**
 * Server-side, model-agnostic backstop against reasoning models that inline their
 * chain-of-thought (or a failed attempt at a structured tool call) as literal TEXT in
 * `delta.content`, instead of on the dedicated `delta.reasoning` channel that
 * openai-compatible.ts's `reasoningFallback` already handles. Measured on `qwen/qwen3.6-27b`: 6 of
 * 8 successful answers leaked this markup into the user's answer bubble. Verbatim example (a real
 * captured answer):
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
 * Deliberately narrow -- explicit known tag names only, never a generic `<[^>]+>` sweep: only the
 * known tag families below are ever treated as markup. A legitimate answer mentioning `<script>`
 * or comparing `size < 500` is untouched -- neither is a prefix of any recognized tag, so both
 * fall straight through as plain text.
 *
 * Also strips DeepSeek's `<｜DSML｜...｜>` gateway markup (note: those are FULLWIDTH VERTICAL LINE,
 * U+FF5C, not ASCII `|`). Measured live on `deepseek.v3.2` through an OpenAI-compatible gateway:
 * unlike `<think>`/`<tool_call>`, this marker never showed a closing tag in any captured sample --
 * real answer text runs on immediately after it,
 * same line, e.g. `...\n\n<｜DSML｜function_callsThere were no critical findings...`. Treating it as
 * a depth-incrementing opener (like `<think>`) would therefore suppress the entire rest of the
 * answer as if it were still-open reasoning, which is wrong: it is a zero-width glitch token, not a
 * container. It is matched and deleted in place instead, without touching `depth`.
 *
 * One captured turn also leaked a verbatim fragment of our own system prompt immediately after this
 * marker ("Stop after you answer the question; do not preemptively continue..."). That is the model
 * parroting its instructions as prose, not a delimited tag -- there is no markup to match, so it
 * cannot be stripped by this filter (or any regex). Left as a known residual gap.
 */

/** Tag families this filter recognizes as reasoning/tool-call-as-text markup, never as prose. */
const OPEN_TAG_RE =
  /<think>|<tool_call>|<function(?:=[^<>]*)?>|<parameter(?:=[^<>]*)?>/;
const CLOSE_TAG_RE = /<\/think>|<\/tool_call>|<\/function>|<\/parameter>/;

/** DeepSeek's fixed marker prefix (FULLWIDTH VERTICAL LINE, U+FF5C, on both sides of `DSML`). */
const DSML_PREFIX = '｜DSML｜';
/** The literal identifier every captured sample used after the prefix. Matched as a fixed string
 * rather than an open-ended `[A-Za-z_]*` sweep: the marker is glued directly onto the real answer
 * text with no delimiter (`...｜DSML｜function_callsThere were no critical findings...`), so a
 * greedy identifier match would swallow the start of the answer itself (`There`) along with it. */
const DSML_IDENTIFIER = 'function_calls';
/** The marker as observed live: prefix + identifier, never a closing tag -- matched and deleted as
 * a zero-width glitch, not treated as a suppressing opener (see doc comment above). */
const DSML_MARKER_RE = new RegExp(`<${DSML_PREFIX}${DSML_IDENTIFIER}`);

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
  if (/^function(=.*)?$/.test(tail) || /^parameter(=.*)?$/.test(tail)) {
    return true;
  }
  if (DSML_PREFIX.startsWith(tail)) {
    return true; // Still building up to "｜DSML｜" itself.
  }
  if (tail.startsWith(DSML_PREFIX)) {
    // Past the prefix: only a strict prefix of the fixed identifier can still complete the
    // marker (never a superset of it -- that's the whole point of using a fixed string here).
    return DSML_IDENTIFIER.startsWith(tail.slice(DSML_PREFIX.length));
  }
  return false;
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
 * to end of stream -- `flush()` simply never releases text that was accumulated while `depth > 0`.
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
        const dsmlMatch = DSML_MARKER_RE.exec(this.buffer);
        const earliest =
          openMatch && (!dsmlMatch || openMatch.index <= dsmlMatch.index)
            ? { match: openMatch, isDsml: false }
            : dsmlMatch
            ? { match: dsmlMatch, isDsml: true }
            : null;
        if (earliest) {
          const { match, isDsml } = earliest;
          out += this.buffer.slice(0, match.index);
          this.buffer = this.buffer.slice(match.index + match[0].length);
          this.stripped = true;
          if (!isDsml) {
            this.depth = 1;
          }
          // DSML marker is a zero-width glitch token, not a container: depth stays 0 and
          // whatever follows on the same line (the real answer) is emitted normally.
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
