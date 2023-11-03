import {
  EuiBottomBar,
  EuiButton,
  EuiButtonEmpty,
  EuiCheckbox,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
} from '@elastic/eui';
import React, { useEffect, useState } from 'react';
import { FormattedMessage, I18nProvider } from '@osd/i18n/react';
import { useUserPreferences } from '../hooks';
import { areThereNewUpdates } from '../utils';
import { getCore } from '../plugin-services';
import { AvailableUpdates } from '../../../wazuh-check-updates/common/types';
import { getAvailableUpdates } from '../services';

export const UpdatesNotification = () => {
  const [availableUpdates, setAvailableUpdates] = useState<AvailableUpdates>();
  const [isDismissed, setIsDismissed] = useState(false);
  const [dismissFutureUpdates, setDismissFutureUpdates] = useState(false);

  const {
    userPreferences,
    error: userPreferencesError,
    isLoading: isLoadingUserPreferences,
    updateUserPreferences,
  } = useUserPreferences();

  const updateAvailableUpdates = async () => {
    try {
      const availableUpdates = await getAvailableUpdates();
      setAvailableUpdates(availableUpdates);
    } catch (e) {}
  };

  useEffect(() => {
    if (isLoadingUserPreferences || userPreferences.hide_update_notifications) return;
    updateAvailableUpdates();
  }, [userPreferences?.hide_update_notifications, isLoadingUserPreferences]);

  if (isLoadingUserPreferences || userPreferencesError) {
    return null;
  }

  if (userPreferences?.hide_update_notifications) {
    return null;
  }

  if (isDismissed) return null;

  const mustNotifyUser = areThereNewUpdates(
    availableUpdates?.apis_available_updates,
    userPreferences.last_dismissed_updates
  );

  const handleOnChangeDismiss = (checked: boolean) => {
    setDismissFutureUpdates(checked);
  };

  const handleOnClose = () => {
    updateUserPreferences({
      last_dismissed_updates: availableUpdates?.apis_available_updates?.map(
        (apiAvailableUpdates) => {
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
        }
      ),
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
                    defaultMessage="New release is available!"
                  />
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={false} style={{ maxWidth: 'max-content' }}>
                <EuiButtonEmpty
                  color="ghost"
                  onClick={() =>
                    getCore().application.navigateToApp('wazuh', { path: '#/settings?tab=api' })
                  }
                >
                  <FormattedMessage
                    id="wazuhCheckUpdates.updatesNotification.linkText"
                    defaultMessage="Go to the API configuration page for details"
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
                <EuiButton fill size="s" iconType="cross" onClick={() => handleOnClose()}>
                  <FormattedMessage
                    id="wazuhCheckUpdates.updatesNotification.closeButtonText"
                    defaultMessage="Dismiss"
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
