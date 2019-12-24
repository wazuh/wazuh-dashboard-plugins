import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  
} from "@elastic/eui";
import WzConfigurationSettingsTabSelector from "../util-components/configuration-settings-tab-selector";
import WzConfigurationSettingsGroup from '../util-components/configuration-settings-group';
import helpLinks from './help-links';

const allSettings = [
  { key: 'disabled', text: 'Policy monitoring service status'},
  { key: 'base_directory', text: 'Base directory' },
  { key: 'scanall', text: 'Scan the entire system' },
  { key: 'frequency', text: 'Frequency (in seconds) to run the scan' },
  { key: 'check_dev', text: 'Check /dev path' },
  { key: 'check_files', text: 'Check files' },
  { key: 'check_if', text: 'Check network interfaces' },
  { key: 'check_pids', text: 'Check processes IDs' },
  { key: 'check_ports', text: 'Check network ports' },
  { key: 'check_sys', text: 'Check anomalous system objects' },
  { key: 'check_trojans', text: 'Check trojans' },
  { key: 'check_unixaudit', text: 'Check UNIX audit' },
  { key: 'check_winapps', text: 'Check Windows apps' },
  { key: 'check_winaudit', text: 'Check Windows audit' },
  { key: 'check_winmalware', text: 'Check Windows malware' },
  { key: 'skip_nfs', text: 'Skip scan on CIFS/NFS mounts' },
  { key: 'rootkit_files', text: 'Rootkit files database path' },
  { key: 'rootkit_trojans', text: 'Rootkit trojans database path' },
  { key: 'windows_audit', text: 'Rootkit trojans database path' },
  { key: 'windows_apps', text: 'Rootkit trojans database path' },
  { key: 'windows_malware', text: 'Rootkit trojans database path' }
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