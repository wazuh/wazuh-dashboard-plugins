import React from 'react';
import { getWazuhCheckUpdatesPlugin } from '../../kibana-services';

export const WzCtiUpsellNotification = () => {
  const { ctiRegistrationUiEnabled, CtiUpsellNotification } =
    getWazuhCheckUpdatesPlugin();

  if (!ctiRegistrationUiEnabled) {
    return null;
  }

  return <CtiUpsellNotification />;
};
