import { EuiCheckbox } from '@elastic/eui';
import React, { useEffect, useState } from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import { useUserPreferences } from '../hooks';

export const DismissNotificationCheck = () => {
  const [dismissFutureUpdates, setDismissFutureUpdates] = useState<boolean>();

  const { userPreferences, error, isLoading, updateUserPreferences } = useUserPreferences();

  useEffect(() => {
    if (isLoading) return;
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
    <EuiCheckbox
      id="check-dismiss"
      label={
        <FormattedMessage
          id="wazuhCheckUpdates.updatesNotification.dismissCheckText"
          defaultMessage="I don't want to know about future releases"
        />
      }
      checked={dismissFutureUpdates}
      onChange={(e) => handleOnChange(e.target.checked)}
      disabled={isLoading}
    />
  );
};