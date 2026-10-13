import React from 'react';
import { getWazuhCheckUpdatesPlugin } from '../../kibana-services';

export const WzCtiUpsellNotification = () => {
  const { ctiRegistrationUiEnabled, ctiUpsellEnabled, CtiUpsellNotification } =
    getWazuhCheckUpdatesPlugin();

  if (!ctiRegistrationUiEnabled || !ctiUpsellEnabled) {
    return null;
  }

  return <CtiUpsellNotification />;
};
