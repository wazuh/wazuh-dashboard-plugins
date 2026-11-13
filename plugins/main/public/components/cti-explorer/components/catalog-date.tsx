import React from 'react';
import { EuiToolTip } from '@elastic/eui';
import { formatDate, formatUtcTimestamp } from '../utils/labels';

/**
 * A date of the catalog: the day in the user's locale, as the public record
 * has it (UTC); the full timestamp, in UTC, in the tooltip.
 */
export const CatalogDate = ({ value }: { value: string | null }) => {
  const timestamp = formatUtcTimestamp(value);
  if (!timestamp) {
    return <>-</>;
  }
  return (
    <EuiToolTip content={timestamp}>
      <time
        dateTime={value ?? undefined}
        className='eui-textNoWrap'
        data-test-subj='ctiExplorerCatalogDate'
      >
        {formatDate(value)}
      </time>
    </EuiToolTip>
  );
};
