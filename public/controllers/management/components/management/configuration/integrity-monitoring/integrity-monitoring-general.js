/*
* Wazuh app - React component for registering agents.
* Copyright (C) 2015-2020 Wazuh, Inc.
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 2 of the License, or
* (at your option) any later version.
*
* Find more information about this on the LICENSE file.
*/

import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";

import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';
import WzSettingsGroup from "../util-components/configuration-settings-group";

import { renderValueOrDefault, renderValueOrNoValue, renderValueOrYes, renderValueOrNo, renderValueNoThenEnabled } from '../utils/utils';

import helpLinks from './help-links';

const mainSettings = [
  { field: 'disabled', label: 'Integrity monitoring status', render: renderValueNoThenEnabled },
  { field: 'frequency', label: 'Interval (in seconds) to run the integrity scan' },
  { field: 'scan_time', label: 'Time of day to run integrity scans', render: renderValueOrNoValue },
  { field: 'scan_day', label: 'Day of the week to run integrity scans', render: renderValueOrNoValue },
  { field: 'auto_ignore', label: 'Ignore files that change too many times', render: renderValueOrNo, when: 'manager' },
  { field: 'alert_new_files', label: 'Alert when new files are created', render: renderValueOrNo, when: 'manager' },
  { field: 'scan_on_start', label: 'Scan on start' },
  { field: 'skip_nfs', label: 'Skip scan on CIFS/NFS mounts' },
  { field: 'remove_old_diff', label: 'Remove old local snapshots', render: renderValueOrYes },
  { field: 'restart_audit', label: 'Restart the Audit daemon' },
  { field: 'windows_audit_interval', label: 'Interval (in seconds) to check directories\' SACLs', render: renderValueOrDefault('300') },
  { field: 'prefilter_cmd', label: 'Command to prevent prelinking', render: renderValueOrNoValue },
];

const mainSettingsFroAgentOrManager = (agent) => agent.id === '000' ? mainSettings : mainSettings.filter(setting => setting.when !== 'manager' )

class WzConfigurationIntegrityMonitoringGeneral extends Component{
  constructor(props){
    super(props);
  }
  render(){
    const { currentConfig, agent } = this.props;
    return (
      <Fragment>
        <WzConfigurationSettingsTabSelector
          title='General'
          description='The settings shown below are applied globally'
          currentConfig={currentConfig}
          minusHeight={this.props.agent.id === '000' ? 340 : 410}
          helpLinks={helpLinks}
        >
          <WzSettingsGroup
            config={currentConfig['syscheck-syscheck'].syscheck}
            items={mainSettingsFroAgentOrManager(agent)}
          />
        </WzConfigurationSettingsTabSelector>
      </Fragment>
    )
  }
}

WzConfigurationIntegrityMonitoringGeneral.proptTypes = {
  // currentConfig: PropTypes.object.isRequired,
  agent: PropTypes.object
};

export default WzConfigurationIntegrityMonitoringGeneral;