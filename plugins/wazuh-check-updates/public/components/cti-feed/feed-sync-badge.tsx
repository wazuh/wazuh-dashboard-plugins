import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiBadge } from '@elastic/eui';
import type { ConsumerSyncState } from '../../services/cti-consumer-sync-state';

export const FeedSyncBadge: React.FC<{
  state: ConsumerSyncState;
  dataTestSubj?: string;
}> = ({ state, dataTestSubj = 'ctiFeedSyncBadge' }) => {
  switch (state.kind) {
    case 'upToDate':
      return (
        <EuiBadge color='success' data-test-subj={dataTestSubj}>
          {i18n.translate('wazuhCheckUpdates.ctiFeed.sync.badge.upToDate', {
            defaultMessage: 'Up to date',
          })}
        </EuiBadge>
      );
    case 'pending':
      return (
        <EuiBadge color='primary' data-test-subj={dataTestSubj}>
          {i18n.translate('wazuhCheckUpdates.ctiFeed.sync.badge.pending', {
            defaultMessage: 'Update available',
          })}
        </EuiBadge>
      );
    case 'syncing':
      return (
        <EuiBadge color='warning' data-test-subj={dataTestSubj}>
          {i18n.translate('wazuhCheckUpdates.ctiFeed.sync.badge.syncing', {
            defaultMessage: 'Syncing',
          })}
        </EuiBadge>
      );
    case 'failed':
      return (
        <EuiBadge color='danger' data-test-subj={dataTestSubj}>
          {i18n.translate('wazuhCheckUpdates.ctiFeed.sync.badge.failed', {
            defaultMessage: 'Sync failed',
          })}
        </EuiBadge>
      );
    default:
      return (
        <EuiBadge color='hollow' data-test-subj={dataTestSubj}>
          {state.rawStatus ||
            i18n.translate('wazuhCheckUpdates.ctiFeed.sync.badge.unknown', {
              defaultMessage: 'Unknown',
            })}
        </EuiBadge>
      );
  }
};
