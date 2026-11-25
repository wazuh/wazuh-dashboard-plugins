import React from 'react';
import { getWazuhCheckUpdatesPlugin } from '../../kibana-services';

export const WzCtiRegisterNotification = () => {
  const { ctiRegistrationUiEnabled, CtiRegisterNotification } =
    getWazuhCheckUpdatesPlugin();

  if (!ctiRegistrationUiEnabled) {
    return null;
  }

  return <CtiRegisterNotification />;
};
