import {
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHealth,
  EuiIconTip,
  EuiLoadingSpinner,
} from '@elastic/eui';
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
      <EuiFlexItem grow={false} style={{ maxWidth: 'max-content' }}>
        {!isLoading ? (
          <EuiFlexGroup gutterSize="none" wrap={false}>
            <EuiFlexItem grow={false} style={{ maxWidth: 'max-content' }}>
              <EuiHealth color={color}>
                <FormattedMessage
                  id={`wazuhCheckUpdates.upToDateStatus.${i18nMessageId}`}
                  defaultMessage={defaultMessage}
                />
              </EuiHealth>
            </EuiFlexItem>
            <EuiFlexItem grow={false} style={{ maxWidth: 'max-content' }}>
              <EuiIconTip
                type="iInCircle"
                color="subdued"
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
                iconProps={{
                  className: 'eui-alignTop',
                }}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        ) : (
          <EuiLoadingSpinner size="m" />
        )}
      </EuiFlexItem>
      <EuiFlexItem grow={false} style={{ maxWidth: 'max-content' }}>
        <EuiButton isLoading={isLoading} onClick={handleOnClick} size="s">
          <FormattedMessage
            id="wazuhCheckUpdates.upToDateStatus.buttonText"
            defaultMessage="Check updates"
          />
        </EuiButton>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
