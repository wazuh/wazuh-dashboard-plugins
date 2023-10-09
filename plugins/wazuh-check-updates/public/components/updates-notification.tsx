import {
  EuiBottomBar,
  EuiButton,
  EuiButtonEmpty,
  EuiCheckbox,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
} from '@elastic/eui';
import React, { useState } from 'react';
import { FormattedMessage, I18nProvider } from '@osd/i18n/react';
import { useAvailableUpdates, useUserPreferences } from '../hooks';
import { areThereNewUpdates } from '../utils';
import { getCore } from '../plugin-services';

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
    apisAvailableUpdates,
    error: getAvailableUpdatesError,
    isLoading: isLoadingAvailableUpdates,
  } = useAvailableUpdates();

  if (userPreferencesError) {
    return null;
  }

  if (getAvailableUpdatesError) {
    return null;
  }

  if (isLoadingAvailableUpdates || isLoadingUserPreferences) {
    return null;
  }

  if (userPreferences?.hide_update_notifications) {
    return null;
  }

  if (isDismissed) return null;

  const mustNotifyUser = areThereNewUpdates(
    apisAvailableUpdates,
    userPreferences.last_dismissed_updates
  );

  const handleOnChangeDismiss = (checked: boolean) => {
    setDismissFutureUpdates(checked);
  };

  const handleOnClose = () => {
    updateUserPreferences({
      last_dismissed_updates: apisAvailableUpdates.map((apiAvailableUpdates) => {
        const {
          api_id,
          last_available_major,
          last_available_minor,
          last_available_patch,
        } = apiAvailableUpdates;
        return {
          api_id,
          last_major: last_available_major?.tag,
          last_minor: last_available_minor?.tag,
          last_patch: last_available_patch?.tag,
        };
      }),
      ...(dismissFutureUpdates ? { hide_update_notifications: true } : {}),
    });
    setIsDismissed(true);
  };

  return mustNotifyUser ? (
    <I18nProvider>
      <EuiBottomBar>
        <EuiFlexGroup justifyContent="spaceBetween" alignItems="center" gutterSize="m">
          <EuiFlexItem grow={false}>
            <EuiFlexGroup gutterSize="m" alignItems="center">
              <EuiFlexItem grow={false} style={{ maxWidth: 'max-content' }}>
                <EuiText>
                  <FormattedMessage
                    id="wazuhCheckUpdates.updatesNotification.message"
                    defaultMessage="Wazuh new release is available!"
                  />
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={false} style={{ maxWidth: 'max-content' }}>
                <EuiButtonEmpty
                  href={getCore().http.basePath.prepend('/app/wazuh#/settings?tab=about')}
                >
                  <FormattedMessage
                    id="wazuhCheckUpdates.updatesNotification.linkText"
                    defaultMessage="Go to the about page for details"
                  />
                </EuiButtonEmpty>
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
