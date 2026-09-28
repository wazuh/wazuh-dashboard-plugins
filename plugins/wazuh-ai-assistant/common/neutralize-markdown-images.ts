/**
 * Neutralizes markdown images in untrusted assistant prose so they cannot render as a live `<img>`
 * (an uncontrolled, no-click outbound fetch). Every image form — inline `![alt](url)`, reference
 * `![alt][id]`, shortcut `![id]`, and every alt-text variant — is defined by a `!` immediately
 * before a `[`; removing that `!` turns any form into a plain link or literal, so one rule covers
 * all forms instead of a per-form regex. Used server-side before an answer is stored; on the client
 * the render layer additionally drops the `img` node via an `EuiMarkdownFormat` processing plugin.
 */

/** Fenced code blocks and inline code spans, captured so `split` keeps each code segment as its own
 * (odd-index) element: a literal `![x](y)` in a code sample is left as written. */
const CODE_SEGMENT = /(```[\s\S]*?```|`[^`\n]*`)/g;

/** Remove the image marker from one prose segment: one or more `!` immediately before a `[` (so
 * even `!![x]` leaves no `![`). Only a `!` directly against a `[` matches, so `Done! [link]` and
 * `5 != [1]` are untouched. */
export function stripImageMarkersFromProse(segment: string): string {
  return segment.replace(/!+(?=\[)/g, '');
}

/** An escaped backtick (`\``) is a literal, not a code-span delimiter, but `CODE_SEGMENT` cannot
 * tell them apart and would mis-open a span there, hiding an image right after it. Masked before the
 * split and restored after. */
const ESCAPED_BACKTICK = /\\`/g;
const ESCAPED_BACKTICK_MASK = '\u0000';

export function neutralizeMarkdownImages(content: string): string {
  return (
    content
      // split/join, not a `RegExp`, to keep the control-char sentinel out of a pattern (no-control-regex).
      .split(ESCAPED_BACKTICK_MASK)
      .join('')
      .replace(ESCAPED_BACKTICK, ESCAPED_BACKTICK_MASK)
      .split(CODE_SEGMENT)
      .map((segment, index) =>
        index % 2 === 1 ? segment : stripImageMarkersFromProse(segment),
      )
      .join('')
      .split(ESCAPED_BACKTICK_MASK)
      .join('\\`')
  );
}
