import { EuiCheckbox } from '@elastic/eui';
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
    console.log(error);
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
          <FormattedMessage
            id="wazuhCheckUpdates.dismissNotificationCheck.checkText"
            defaultMessage="Disable updates notifications"
          />
        }
        checked={dismissFutureUpdates}
        onChange={(e) => handleOnChange(e.target.checked)}
        disabled={isLoading}
      />
    </I18nProvider>
  );
};
