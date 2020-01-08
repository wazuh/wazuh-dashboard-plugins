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
import Proptypes from "prop-types";

import {
  
} from "@elastic/eui";
import WzConfigurationSettingsTabSelector from "../util-components/configuration-settings-tab-selector";
import WzConfigurationSettingsGroup from '../util-components/configuration-settings-group';
import helpLinks from './help-links';

const allSettings = [
  { field: 'disabled', label: 'Policy monitoring service status'},
  { field: 'base_directory', label: 'Base directory' },
  { field: 'scanall', label: 'Scan the entire system' },
  { field: 'frequency', label: 'Frequency (in seconds) to run the scan' },
  { field: 'check_dev', label: 'Check /dev path' },
  { field: 'check_files', label: 'Check files' },
  { field: 'check_if', label: 'Check network interfaces' },
  { field: 'check_pids', label: 'Check processes IDs' },
  { field: 'check_ports', label: 'Check network ports' },
  { field: 'check_sys', label: 'Check anomalous system objects' },
  { field: 'check_trojans', label: 'Check trojans' },
  { field: 'check_unixaudit', label: 'Check UNIX audit' },
  { field: 'check_winapps', label: 'Check Windows apps' },
  { field: 'check_winaudit', label: 'Check Windows audit' },
  { field: 'check_winmalware', label: 'Check Windows malware' },
  { field: 'skip_nfs', label: 'Skip scan on CIFS/NFS mounts' },
  { field: 'rootkit_files', label: 'Rootkit files database path' },
  { field: 'rootkit_trojans', label: 'Rootkit trojans database path' },
  { field: 'windows_audit', label: 'Rootkit trojans database path' },
  { field: 'windows_apps', label: 'Rootkit trojans database path' },
  { field: 'windows_malware', label: 'Rootkit trojans database path' }
];

class WzConfigurationPolicyMonitoringGeneral extends Component{
  constructor(props){
    super(props);
  }
  render(){
    const { currentConfig } = this.props;
    const allSettingsConfig = {
      ...currentConfig['syscheck-rootcheck'].rootcheck,
      disabled: currentConfig['syscheck-rootcheck'].rootcheck.disabled === 'no' ? 'enabled' : 'disabled'
    };

    return (
      <WzConfigurationSettingsTabSelector
        title='All settings'
        description='General settings for the rootcheck daemon'
        currentConfig={currentConfig} helpLinks={helpLinks}>
          <WzConfigurationSettingsGroup
            config={allSettingsConfig}
            items={allSettings}
          />
      </WzConfigurationSettingsTabSelector>
    )
  }
}

export default WzConfigurationPolicyMonitoringGeneral;