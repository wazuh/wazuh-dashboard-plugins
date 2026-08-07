import React from 'react';
import { EuiText } from '@elastic/eui';

/** Hairline that reads on both the light and dark themes. */
const SUBTLE_BORDER = '1px solid rgba(128, 128, 128, 0.2)';

/** Approx. rendered height of one `BarList`/`TopNTable` row. */
export const TOP_N_ROW_HEIGHT = 36;

/**
 * A list only calls out its unfilled slots once this share of them is empty;
 * below that the leftover gap is smaller than the note explaining it.
 */
const MORE_ITEMS_NOTE_MIN_MISSING_RATIO = 0.5;

/** Slots a ranked list left unfilled, and whether to say so. */
export function getMissingSlots(
  itemCount: number,
  totalSlots?: number,
): { count: number; showNote: boolean } {
  if (!totalSlots) {
    return { count: 0, showNote: false };
  }
  const count = Math.max(0, totalSlots - itemCount);
  return {
    count,
    showNote:
      itemCount > 0 && count >= totalSlots * MORE_ITEMS_NOTE_MIN_MISSING_RATIO,
  };
}

/** Small caption above a ranked list, e.g. "Top 5 modified files". */
export const ListTitle: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <EuiText
    size='xs'
    style={{
      paddingTop: 4,
      paddingBottom: 6,
      marginBottom: 10,
      borderBottom: SUBTLE_BORDER,
    }}
  >
    <strong>{children}</strong>
  </EuiText>
);

export interface MoreItemsNoteProps {
  message: React.ReactNode;
  /** Rows worth of height to reserve. */
  missingSlots: number;
  style?: React.CSSProperties;
}

/** Filler keeping a short list as tall as a full one, and saying why. */
export const MoreItemsNote: React.FC<MoreItemsNoteProps> = ({
  message,
  missingSlots,
  style,
}) => (
  <div
    style={{
      minHeight: missingSlots * TOP_N_ROW_HEIGHT,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...style,
    }}
  >
    <EuiText size='xs' color='subdued'>
      {message}
    </EuiText>
  </div>
);
