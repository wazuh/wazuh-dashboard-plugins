/**
 * Server-side, model-agnostic backstop against duplicate markdown tables in assistant prose
 * (observed with gpt-4o-mini vs. stronger models): the system prompt (server/prompts.ts)
 * asks the model never to hand-build a markdown table of the digest sample rows in its answer —
 * the UI already renders the REAL result table below the answer (result-table.tsx), so a
 * second, model-authored one is redundant and can mislead (the sample is only a partial preview).
 * Weaker models honor that instruction; stronger ones have been observed ignoring it. A prompt
 * rule is advisory only, so this module enforces the same outcome mechanically, regardless of
 * which model is behind the wire.
 *
 * Wired into server/routes/chat.ts's orchestration loop: applied to `delta` text ONLY, and only
 * once at least one non-empty `table` StreamEvent has already been emitted this turn (before
 * that, there is nothing to duplicate, and an honest "no results" turn must not have its own
 * prose mangled).
 */

/** The one line emitted in place of each dropped table block. */
export const TABLE_REPLACEMENT_LINE = '(see the results table below)';

/** A line opens/closes a fenced code block when its trimmed form starts with 3+ backticks (the
 * language tag, if any, is irrelevant to the toggle). */
function isFenceDelimiter(trimmedLine: string): boolean {
  return trimmedLine.startsWith('```');
}

/** A markdown pipe-table row: starts with '|' and has at least one more '|' after it (so a
 * header/data row like "| a | b |" matches, but a stray prose "a | b" does not — it doesn't
 * start with '|'). */
function isPipeRow(trimmedLine: string): boolean {
  return trimmedLine.startsWith('|') && trimmedLine.indexOf('|', 1) !== -1;
}

/** A separator row, e.g. "|---|---|" or "|:--|--:|" — composed entirely of pipes, dashes,
 * colons, and whitespace, with at least one of each of '-' and '|' (so a lone "|" or a lone
 * "---" line, neither of which reads as a table separator on its own, doesn't match). */
function isSeparatorRow(trimmedLine: string): boolean {
  return (
    /^[\s|:-]+$/.test(trimmedLine) &&
    trimmedLine.includes('-') &&
    trimmedLine.includes('|')
  );
}

/** Whether a single (trimmed, non-empty) line reads as one row of a markdown pipe table. A
 * single line matching this is NOT by itself a table — see `MarkdownTableSuppressor`'s doc
 * comment: only 2+ CONSECUTIVE such lines are treated as a block. */
function isTableRowLine(trimmedLine: string): boolean {
  if (trimmedLine.length === 0) {
    return false;
  }
  return isPipeRow(trimmedLine) || isSeparatorRow(trimmedLine);
}

/**
 * Stateful, streaming-safe suppressor for model-authored markdown table blocks.
 *
 * Buffers text line-by-line: a line is only classified once its trailing `\n` arrives, since
 * token streaming can split a single line across many `push()` calls (and even a single table
 * row across many chunks) — see `push()`. `flush()` must be called once the underlying stream
 * ends, to release any not-yet-newline-terminated remainder and resolve any still-pending
 * candidate lines.
 *
 * A markdown table BLOCK is two or more CONSECUTIVE lines each matching `isTableRowLine` (a
 * pipe-row or a separator row). A recognized block is dropped in full and replaced with exactly
 * one `TABLE_REPLACEMENT_LINE`. A single stray line with a pipe in it (common in ordinary prose,
 * e.g. "a | b") is never treated as a table and always passes through unchanged. Multiple
 * separate blocks in the same stream each get their own single replacement line.
 *
 * Fenced code blocks (``` ... ```) pass through completely untouched, including any pipe-looking
 * lines inside them — fence state is tracked across `push()` calls the same way line buffering is.
 *
 * Deliberately conservative: anything not confidently a 2+ line table block passes through
 * byte-identical. When no table block is ever seen, `push()`/`flush()` together are a no-op
 * identity transform over the concatenated input.
 */
export class MarkdownTableSuppressor {
  /** Text received since the last '\n' — not yet known to be a complete line. */
  private lineBuffer = '';
  /** Held candidate table-row lines (each including its trailing '\n'), not yet resolved into
   * either a dropped block or pass-through. */
  private pending: string[] = [];
  private inFence = false;

  /** Feeds one chunk (of any size, possibly not line-aligned); returns the portion now safe to
   * emit. May return '' when the chunk only extended a not-yet-terminated line or a still-growing
   * candidate run — nothing is lost, it will surface on a later `push()` or on `flush()`. */
  push(chunk: string): string {
    this.lineBuffer += chunk;
    let out = '';
    let newlineIndex = this.lineBuffer.indexOf('\n');
    while (newlineIndex !== -1) {
      const line = this.lineBuffer.slice(0, newlineIndex + 1); // includes the trailing '\n'
      this.lineBuffer = this.lineBuffer.slice(newlineIndex + 1);
      out += this.consumeLine(line);
      newlineIndex = this.lineBuffer.indexOf('\n');
    }
    return out;
  }

  /** Releases any pending candidate lines and any not-newline-terminated remainder. Safe to call
   * once the underlying stream has ended; idempotent (returns '' if called again with nothing
   * left buffered). */
  flush(): string {
    let out = this.resolvePending();
    if (this.lineBuffer) {
      out += this.lineBuffer;
      this.lineBuffer = '';
    }
    return out;
  }

  /** `line` always includes its trailing '\n' here (only whole lines reach this method). */
  private consumeLine(line: string): string {
    const trimmed = line.trim();

    if (this.inFence) {
      if (isFenceDelimiter(trimmed)) {
        this.inFence = false;
      }
      return line; // Untouched — including any '|' inside the fence.
    }

    if (isFenceDelimiter(trimmed)) {
      // Entering a fence always ends whatever candidate run preceded it (a table block can't
      // legally straddle a fence boundary).
      const resolved = this.resolvePending();
      this.inFence = true;
      return resolved + line;
    }

    if (isTableRowLine(trimmed)) {
      this.pending.push(line);
      return '';
    }

    // Ordinary line: resolve whatever candidate run preceded it, then pass this one through.
    return this.resolvePending() + line;
  }

  /** Decides the fate of `this.pending`: 2+ lines collapse into one `TABLE_REPLACEMENT_LINE`;
   * 0-1 lines (nothing, or a single stray pipe/separator-looking line) pass through verbatim.
   * Clears `this.pending` either way. */
  private resolvePending(): string {
    if (this.pending.length === 0) {
      return '';
    }
    const out =
      this.pending.length >= 2
        ? `${TABLE_REPLACEMENT_LINE}\n`
        : this.pending.join('');
    this.pending = [];
    return out;
  }
}
