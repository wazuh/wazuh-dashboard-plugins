import React from 'react';
import { getWazuhCheckUpdatesPlugin } from '../../kibana-services';

export const WzCtiRegisterNotification = () => {
  const {
    ctiRegistrationUiEnabled,
    ctiUpgradeEnabled,
    CtiRegisterNotification,
  } = getWazuhCheckUpdatesPlugin();

  if (!ctiRegistrationUiEnabled || !ctiUpgradeEnabled) {
    return null;
  }

  return <CtiRegisterNotification />;
};
