import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiText } from '@elastic/eui';
import { NewestIndicator } from '../../interfaces/types';

export interface NewestIndicatorRowProps {
  newestIndicator?: NewestIndicator;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function daysAgoLabel(lastSeen: string): string {
  const daysAgo = Math.max(
    0,
    Math.floor((Date.now() - new Date(lastSeen).getTime()) / MS_PER_DAY),
  );
  return daysAgo === 0 ? 'Today' : `${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`;
}

/** Freshness readout for the Threat catalog card; renders nothing for an empty catalog. */
export const NewestIndicatorRow: React.FC<NewestIndicatorRowProps> = ({
  newestIndicator,
}) => {
  if (!newestIndicator) {
    return null;
  }

  return (
    <EuiFlexGroup
      alignItems='center'
      justifyContent='spaceBetween'
      gutterSize='s'
      responsive={false}
      data-test-subj='threat-catalog-newest-indicator'
    >
      <EuiFlexItem grow={false}>
        <EuiText size='xs'>
          Newest indicator
          {newestIndicator.feedName && (
            <EuiText size='xs' color='subdued'>
              Feed: {newestIndicator.feedName}
            </EuiText>
          )}
        </EuiText>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiText size='xs'>{daysAgoLabel(newestIndicator.lastSeen)}</EuiText>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
