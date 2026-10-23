import React, { useEffect, useState } from 'react';
import { EuiText, EuiToolTip } from '@elastic/eui';
import {
  MISSING_CTI_VALUE,
  formatCtiTimestamp,
  getCtiTimestampFromNow,
  parseCtiTimestamp,
} from '../../services/cti-timestamp';

/** How often "5 minutes ago" is recomputed while the page stays open. */
export const CTI_TIMESTAMP_TICK_MS = 60000;

export interface CtiTimestampProps {
  timestamp?: string;
  /** The full sentence around the time, e.g. `Last updated: {time}`. */
  renderText: (time: string) => string;
  dataTestSubj: string;
}

/**
 * A CTI time relative to now, with the exact time in a tooltip. A time the
 * indexer does not report reads as `-`, so the label keeps its place.
 */
export const CtiTimestamp: React.FC<CtiTimestampProps> = ({
  timestamp,
  renderText,
  dataTestSubj,
}) => {
  const parsed = parseCtiTimestamp(timestamp);
  const hasTime = parsed !== null;
  // Bumped every tick only to re-render the relative time.
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!hasTime) {
      return undefined;
    }
    const intervalId = setInterval(
      () => setTick(tick => tick + 1),
      CTI_TIMESTAMP_TICK_MS,
    );
    return () => clearInterval(intervalId);
  }, [hasTime]);

  return (
    <EuiText size='xs' color='subdued' data-test-subj={dataTestSubj}>
      {parsed ? (
        // Below, so it never covers the button or badge stacked above it.
        <EuiToolTip position='bottom' content={formatCtiTimestamp(timestamp)}>
          <time dateTime={timestamp}>
            {renderText(getCtiTimestampFromNow(parsed))}
          </time>
        </EuiToolTip>
      ) : (
        <span>{renderText(MISSING_CTI_VALUE)}</span>
      )}
    </EuiText>
  );
};
