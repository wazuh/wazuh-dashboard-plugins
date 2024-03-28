/*
 * Wazuh app - React Component component to display new updates notification.
 *
 * Copyright (C) 2015-2023 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React from 'react';
import { getWazuhCheckUpdatesPlugin } from '../../kibana-services';
import { WazuhConfig } from '../../react-services/wazuh-config';
import { connect } from 'redux';

const WzUpdatesNotificationMain = props => {
  console.log('WzUpdatesNotificationMain props:', props);
  const wazuhConfig = new WazuhConfig().getConfig();
  const isUpdatesEnabled = !wazuhConfig?.['wazuh.updates.disabled'];
  const { UpdatesNotification } = getWazuhCheckUpdatesPlugin();

  return isUpdatesEnabled ? <UpdatesNotification /> : <></>;
};

const mapStateToProps = state => {
  return {
    appConfig: state.appConfig,
  };
};

export default connect(mapStateToProps, null)(WzUpdatesNotificationMain);
