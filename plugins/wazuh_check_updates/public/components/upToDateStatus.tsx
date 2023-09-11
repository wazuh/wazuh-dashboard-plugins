import { EuiHealth, EuiToolTip } from '@elastic/eui';
import React from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import { useGetAvailableUpdates } from '../hooks';
import { formatUIDate } from '../services';
import { getCurrentAvailableUpdate } from '../utils';

export const UpToDateStatus = () => {
  const {
    availableUpdates,
    error: getAvailableUpdatesError,
    isLoading: isLoadingAvailableUpdates,
  } = useGetAvailableUpdates();

  if (getAvailableUpdatesError) {
    console.log(getAvailableUpdatesError);
    return null;
  }

  if (isLoadingAvailableUpdates) return null;

  const currentUpdate = getCurrentAvailableUpdate(availableUpdates);

  const isUpToDate = !currentUpdate;

  const i18nMessageId = isUpToDate ? 'upToDate' : 'availableUpdates';
  const defaultMessage = isUpToDate ? 'Up to date' : 'Available updates';
  const color = isUpToDate ? 'success' : 'warning';

  return (
    <EuiToolTip
      position="left"
      title={
        <FormattedMessage
          id={`wazuhCheckUpdates.upToDateStatus.lastCheck`}
          defaultMessage="Last check"
        />
      }
      content={
        availableUpdates.last_check ? formatUIDate(new Date(availableUpdates.last_check)) : '-'
      }
    >
      <EuiHealth color={color}>
        <FormattedMessage
          id={`wazuhCheckUpdates.upToDateStatus.${i18nMessageId}`}
          defaultMessage={defaultMessage}
        />
      </EuiHealth>
    </EuiToolTip>
  );
};
