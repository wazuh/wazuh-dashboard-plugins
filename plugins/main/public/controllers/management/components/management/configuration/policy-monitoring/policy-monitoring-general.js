/*
 * Wazuh app - React component for show configuration of policy monitoring - general tab.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import WzConfigurationSettingsHeader from '../util-components/configuration-settings-header';
import WzConfigurationSettingsGroup from '../util-components/configuration-settings-group';
import helpLinks from './help-links';
import { isString, renderValueNoThenEnabled } from '../utils/utils';
import WzNoConfig from '../util-components/no-config';

const allSettings = [
  {
    field: 'disabled',
    label: 'Policy monitoring service status',
    render: renderValueNoThenEnabled,
  },
  { field: 'base_directory', label: 'Base directory' },
  { field: 'scanall', label: 'Scan the entire system' },
  { field: 'frequency', label: 'Frequency (in seconds) to run the scan' },
  { field: 'check_dev', label: 'Check /dev path' },
  { field: 'check_if', label: 'Check network interfaces' },
  { field: 'check_pids', label: 'Check processes IDs' },
  { field: 'check_ports', label: 'Check network ports' },
  { field: 'check_sys', label: 'Check anomalous system objects' },
  { field: 'skip_nfs', label: 'Skip scan on CIFS/NFS mounts' },
];

class WzConfigurationPolicyMonitoringGeneral extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { currentConfig } = this.props;
    const rootcheck = currentConfig?.fim?.rootcheck;

    if (isString(currentConfig?.fim)) {
      return <WzNoConfig error={currentConfig.fim} help={helpLinks} />;
    }

    /* The report only carries the modules the agent runs, so an absent `fim`
    is a module that reported nothing, not a fetch that went wrong. It used to
    be enough to check that the section was empty, because the Server API
    answered for every section that was asked for. */
    if (!rootcheck) {
      return <WzNoConfig error='not-present' help={helpLinks} />;
    }

    return (
      <WzConfigurationSettingsHeader
        title='All settings'
        description='General settings for the rootcheck daemon'
        help={helpLinks}
      >
        <WzConfigurationSettingsGroup config={rootcheck} items={allSettings} />
      </WzConfigurationSettingsHeader>
    );
  }
}

WzConfigurationPolicyMonitoringGeneral.propTypes = {
  currentConfig: PropTypes.object,
};

export default WzConfigurationPolicyMonitoringGeneral;
