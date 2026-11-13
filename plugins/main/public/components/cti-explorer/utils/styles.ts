import type { CSSProperties } from 'react';

/**
 * The theme draws links and stat titles semibold; the explorer shows them, and
 * the counts of its bars, at the weight of the body text.
 */
export const NORMAL_FONT_WEIGHT: CSSProperties = { fontWeight: 'normal' };

/** Text of the breakdown cards: labels, counts and shares. */
export const CARD_TEXT_STYLE: CSSProperties = { fontSize: 14 };

/** Title of each breakdown visualization. */
export const VISUALIZATION_TITLE_STYLE: CSSProperties = { fontSize: 12 };

/**
 * Description of the page header. A block, so its lines take the height of
 * this size instead of the one of the paragraph the header wraps it in.
 */
export const PAGE_DESCRIPTION_STYLE: CSSProperties = {
  display: 'block',
  fontSize: 14,
  lineHeight: 1.5,
};
