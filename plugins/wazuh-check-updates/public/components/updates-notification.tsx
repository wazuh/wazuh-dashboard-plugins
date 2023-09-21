import {
  EuiBadge,
  EuiBottomBar,
  EuiButton,
  EuiCheckbox,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHeaderLink,
  EuiText,
} from '@elastic/eui';
import React, { useState } from 'react';
import { FormattedMessage, I18nProvider } from '@osd/i18n/react';
import { useAvailableUpdates, useUserPreferences } from '../hooks';
import { getCurrentAvailableUpdate } from '../utils';

export const UpdatesNotification = () => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [dismissFutureUpdates, setDismissFutureUpdates] = useState(false);

  const {
    userPreferences,
    error: userPreferencesError,
    isLoading: isLoadingUserPreferences,
    updateUserPreferences,
  } = useUserPreferences();

  const {
    availableUpdates,
    error: getAvailableUpdatesError,
    isLoading: isLoadingAvailableUpdates,
  } = useAvailableUpdates();

  if (userPreferencesError) {
    console.log(userPreferencesError);
    return null;
  }

  if (getAvailableUpdatesError) {
    console.log(getAvailableUpdatesError);
    return null;
  }

  if (isLoadingAvailableUpdates || isLoadingUserPreferences) {
    return null;
  }

  const currentUpdate = getCurrentAvailableUpdate(availableUpdates);

  const hideNotification =
    userPreferences?.hide_update_notifications ||
    userPreferences?.last_dismissed_update === currentUpdate?.tag;

  if (hideNotification) {
    return null;
  }

  const releaseNotesUrl = `https://documentation.wazuh.com/${currentUpdate?.semver.mayor}.${currentUpdate?.semver.minor}/release-notes/release-${currentUpdate?.semver.mayor}-${currentUpdate?.semver.minor}-${currentUpdate?.semver.patch}.html`;
  const isVisible = !isDismissed && !!currentUpdate;

  const handleOnChangeDismiss = (checked: boolean) => {
    setDismissFutureUpdates(checked);
  };

  const handleOnClose = () => {
    updateUserPreferences({
      last_dismissed_update: currentUpdate?.tag,
      ...(dismissFutureUpdates ? { hide_update_notifications: true } : {}),
    });
    setIsDismissed(true);
  };

  return isVisible ? (
    <I18nProvider>
      <EuiBottomBar style={{ backgroundColor: 'white', color: '#1a1c21' }}>
        <EuiFlexGroup justifyContent="spaceBetween" alignItems="center" gutterSize="m">
          <EuiFlexItem grow={false}>
            <EuiFlexGroup gutterSize="m" alignItems="center">
              <EuiFlexItem grow={false} style={{ maxWidth: 'max-content' }}>
                <EuiText>
                  <FormattedMessage
                    id="wazuhCheckUpdates.updatesNotification.message"
                    defaultMessage="Wazuh new release is available now!"
                  />
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={false} style={{ maxWidth: 'max-content' }}>
                <EuiBadge>{currentUpdate.tag}</EuiBadge>
              </EuiFlexItem>
              <EuiFlexItem grow={false} style={{ maxWidth: 'max-content' }}>
                <EuiHeaderLink
                  href={releaseNotesUrl}
                  isActive
                  target="_blank"
                  iconType="popout"
                  iconSide="right"
                >
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
                  id="check-dismiss-in-notification"
                  label={
                    <FormattedMessage
                      id="wazuhCheckUpdates.updatesNotification.dismissCheckText"
                      defaultMessage="Disable updates notifications"
                    />
                  }
                  checked={dismissFutureUpdates}
                  onChange={(e) => handleOnChangeDismiss(e.target.checked)}
                />
              </EuiFlexItem>
              <EuiFlexItem grow={false} style={{ maxWidth: 'max-content' }}>
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
    </I18nProvider>
  ) : null;
};
