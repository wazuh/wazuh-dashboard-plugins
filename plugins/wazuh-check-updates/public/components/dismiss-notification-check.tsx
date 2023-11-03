import { EuiCheckbox, EuiIcon, EuiToolTip } from '@elastic/eui';
import React, { useEffect, useState } from 'react';
import { FormattedMessage, I18nProvider } from '@osd/i18n/react';
import { useUserPreferences } from '../hooks';

export const DismissNotificationCheck = () => {
  const [dismissFutureUpdates, setDismissFutureUpdates] = useState<boolean>();

  const { userPreferences, error, isLoading, updateUserPreferences } = useUserPreferences();

  useEffect(() => {
    if (isLoading) {
      return;
    }
    setDismissFutureUpdates(userPreferences?.hide_update_notifications);
  }, [userPreferences, isLoading]);

  if (error) {
    return null;
  }

  const handleOnChange = (checked: boolean) => {
    updateUserPreferences({ hide_update_notifications: checked });
  };

  return (
    <I18nProvider>
      <EuiCheckbox
        id="check-dismiss"
        label={
          <span>
            <FormattedMessage
              id="wazuhCheckUpdates.dismissNotificationCheck.checkText"
              defaultMessage="Disable updates notifications"
            />{' '}
            <EuiToolTip
              content={
                <FormattedMessage
                  id="wazuhCheckUpdates.dismissNotificationCheck.checkHelp"
                  defaultMessage="This setting determines if a notification will appear every time an update is released"
                />
              }
            >
              <EuiIcon type="questionInCircle" color="primary" />
            </EuiToolTip>
          </span>
        }
        checked={dismissFutureUpdates}
        onChange={(e) => handleOnChange(e.target.checked)}
        disabled={isLoading}
      />
    </I18nProvider>
  );
};
