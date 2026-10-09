import React from 'react';
import { connect } from 'react-redux';
import { getWazuhCheckUpdatesPlugin } from '../../kibana-services';

const mapStateToProps = state => ({
  appConfig: state?.appConfig,
});

export const WzCtiUpsellNotification = connect(mapStateToProps)(
  ({ appConfig }) => {
    const { ctiRegistrationUiEnabled, CtiUpsellNotification } =
      getWazuhCheckUpdatesPlugin();
    const isUpsellEnabled =
      !appConfig?.isLoading &&
      appConfig?.data?.['wazuh.cti.upsell.disabled'] === false;

    if (!ctiRegistrationUiEnabled || !isUpsellEnabled) {
      return null;
    }

    return <CtiUpsellNotification />;
  },
);
