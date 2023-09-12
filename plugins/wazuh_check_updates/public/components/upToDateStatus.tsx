import { EuiButtonEmpty, EuiFlexGroup, EuiFlexItem, EuiHealth, EuiToolTip } from '@elastic/eui';
import React from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import { useAvailableUpdates } from '../hooks';
import { formatUIDate, getCurrentAvailableUpdate } from '../utils';
import { Update } from '../../common/types';

export interface UpToDateStatusProps {
  setCurrentUpdate: (currentUpdate?: Update) => void;
}

export const UpToDateStatus = ({ setCurrentUpdate }: UpToDateStatusProps) => {
  const { availableUpdates, isLoading, getAvailableUpdates } = useAvailableUpdates();

  //TODO: Handle and show error

  const handleOnClick = async () => {
    getAvailableUpdates(true);
  };

  const currentUpdate = getCurrentAvailableUpdate(availableUpdates);

  setCurrentUpdate(currentUpdate);

  const isUpToDate = !currentUpdate;

  const i18nMessageId = isUpToDate ? 'upToDate' : 'availableUpdates';
  const defaultMessage = isUpToDate ? 'Up to date' : 'Available updates';
  const color = isUpToDate ? 'success' : 'warning';

  return (
    <EuiFlexGroup alignItems="center" gutterSize="m">
      {!isLoading ? (
        <EuiFlexItem grow={false} style={{ maxWidth: 'max-content' }}>
          <EuiToolTip
            position="left"
            title={
              <FormattedMessage
                id={`wazuhCheckUpdates.upToDateStatus.lastCheck`}
                defaultMessage="Last check"
              />
            }
            content={
              availableUpdates.last_check
                ? formatUIDate(new Date(availableUpdates.last_check))
                : '-'
            }
          >
            <EuiHealth color={color}>
              <FormattedMessage
                id={`wazuhCheckUpdates.upToDateStatus.${i18nMessageId}`}
                defaultMessage={defaultMessage}
              />
            </EuiHealth>
          </EuiToolTip>
        </EuiFlexItem>
      ) : null}
      <EuiFlexItem grow={false} style={{ maxWidth: 'max-content' }}>
        <EuiButtonEmpty isLoading={isLoading} onClick={handleOnClick} size="s">
          <FormattedMessage
            id="wazuhCheckUpdates.upToDateStatus.buttonText"
            defaultMessage="Check updates"
          />
        </EuiButtonEmpty>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
