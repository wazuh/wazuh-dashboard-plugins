import {
  EuiBottomBar,
  EuiButton,
  EuiCheckbox,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHeaderLink,
  EuiText,
} from '@elastic/eui';
import React, { useState } from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import { useGetAvailableUpdates } from '../hooks';
import { getCurrentAvailableUpdate } from '../utils';

export const UpdatesNotification = () => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [dismissFutureUpdates, setDismissFutureUpdates] = useState(false);

  const {
    availableUpdates,
    error: getAvailableUpdatesError,
    isLoading: isLoadingAvailableUpdates,
  } = useGetAvailableUpdates();

  const handleOnChangeDismiss = (checked: boolean) => {
    setDismissFutureUpdates(checked);
  };

  const handleOnClose = () => {
    setIsDismissed(true);
  };

  if (getAvailableUpdatesError) {
    console.log(getAvailableUpdatesError);
    return null;
  }

  if (isLoadingAvailableUpdates) return null;

  const currentUpdate = getCurrentAvailableUpdate(availableUpdates);

  const releaseNotesUrl = `https://documentation.wazuh.com/current/release-notes/release-${currentUpdate?.semver.mayor}-${currentUpdate?.semver.minor}-${currentUpdate?.semver.patch}.html`;
  const isVisible = !isDismissed && currentUpdate;

  return isVisible ? (
    <EuiBottomBar style={{ backgroundColor: 'white', color: '#1a1c21' }}>
      <EuiFlexGroup justifyContent="spaceBetween" alignItems="center" gutterSize="m">
        <EuiFlexItem grow={false}>
          <EuiFlexGroup gutterSize="m" alignItems="center">
            <EuiFlexItem grow={false}>
              <EuiText>
                <FormattedMessage
                  id="wazuhCheckUpdates.updatesNotification.message"
                  defaultMessage="¡Wazuh new release is available now!"
                />
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiHeaderLink href={releaseNotesUrl} isActive target="_blank">
                {
                  <FormattedMessage
                    id="wazuhCheckUpdates.updatesNotification.linkText"
                    defaultMessage="Go to the release notes for details"
                  />
                }
              </EuiHeaderLink>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiFlexGroup gutterSize="m" alignItems="center">
            <EuiFlexItem grow={false}>
              <EuiCheckbox
                id="check-dismiss"
                label={
                  <FormattedMessage
                    id="wazuhCheckUpdates.updatesNotification.dismissCheckText"
                    defaultMessage="I don't want to know about future releases"
                  />
                }
                checked={dismissFutureUpdates}
                onChange={(e) => handleOnChangeDismiss(e.target.checked)}
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton size="s" iconType="cross" onClick={() => handleOnClose()}>
                <FormattedMessage
                  id="wazuhCheckUpdates.updatesNotification.closeButtonText"
                  defaultMessage="Close"
                />
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiBottomBar>
  ) : null;
};
