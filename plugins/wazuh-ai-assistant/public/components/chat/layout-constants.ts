/**
 * Numbers the chat surface's layout contract (AI/design/redesign-v2-spec.md) needs on BOTH sides of
 * the CSS/TS boundary.
 *
 * They live in their own module rather than in `chat-page.tsx` because `chat-page.tsx` imports
 * `chat-input.tsx`: exporting from there and importing back would close an import cycle for the sake
 * of a constant. A leaf module both can import keeps the value in one place with no cycle.
 *
 * Each one has a twin in `public/components/_redesign.scss` (SCSS cannot read a TS module, and the
 * measurement below cannot be expressed in CSS), so the pair is named identically and documented on
 * both sides — that is the whole reason this file exists instead of two hand-kept literals.
 */

/**
 * Composer autogrow ceiling, in rows: the field grows from a one-line floor to this, then scrolls
 * internally instead of pushing the transcript any further (contract §2). Read in TS rather than
 * CSS because the cap is `line-height * rows + padding`, and only JS can measure the field's own
 * computed line-height. SCSS twin: `$wzComposerMaxRows`.
 */
export const WZ_COMPOSER_MAX_ROWS = 5;
