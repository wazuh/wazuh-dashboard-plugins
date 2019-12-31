import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  
} from "@elastic/eui";

import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';
import WzConfigurationListSelector from '../util-components/configuration-settings-list-selector';
import { settingsListBuilder } from '../utils/builders';
import helpLinks from './help-links';
import { renderValueOrDefault, renderValueOrNoValue, renderValueOrYes, renderValueOrNo, renderValueNoThenEnabled } from '../utils/utils';
import WzSettingsGroup from "../util-components/configuration-settings-group";

const mainSettings = [
  { field: 'disabled', label: 'Integrity monitoring status', render: renderValueNoThenEnabled },
  { field: 'frequency', label: 'Interval (in seconds) to run the integrity scan' },
  { field: 'scan_time', label: 'Time of day to run integrity scans', render: renderValueOrNoValue },
  { field: 'scan_day', label: 'Day of the week to run integrity scans', render: renderValueOrNoValue },
  { field: 'auto_ignore', label: 'Ignore files that change too many times', render: renderValueOrNo },
  { field: 'alert_new_files', label: 'Alert when new files are created', render: renderValueOrNo },
  { field: 'scan_on_start', label: 'Scan on start' },
  { field: 'skip_nfs', label: 'Skip scan on CIFS/NFS mounts' },
  { field: 'remove_old_diff', label: 'Remove old local snapshots', render: renderValueOrYes },
  { field: 'restart_audit', label: 'Restart the Audit daemon' },
  { field: 'windows_audit_interval', label: 'Interval (in seconds) to check directories\' SACLs', render: renderValueOrDefault('300') },
  { field: 'prefilter_cmd', label: 'Command to prevent prelinking', render: renderValueOrNoValue },
];

class WzConfigurationIntegrityMonitoringGeneral extends Component{
  constructor(props){
    super(props);
  }
  render(){
    const { currentConfig } = this.props;
    return (
      <Fragment>
        <WzConfigurationSettingsTabSelector
          title='General'
          description='The settings shown below are applied globally'
          currentConfig={currentConfig}
          helpLinks={helpLinks}
        >
          <WzSettingsGroup
            config={currentConfig['syscheck-syscheck'].syscheck}
            items={mainSettings}
          />
        </WzConfigurationSettingsTabSelector>
      </Fragment>
    )
  }
}

export default WzConfigurationIntegrityMonitoringGeneral;