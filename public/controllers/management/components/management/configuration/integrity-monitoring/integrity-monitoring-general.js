import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  
} from "@elastic/eui";

import WzConfigurationTabSelector from '../util-components/configuration-settings-tab-selector';
import WzConfigurationListSelector from '../util-components/configuration-settings-list-selector';
import { settingsListBuilder } from '../utils/builders';
import helpLinks from './help-links';
import { renderValueOrDefault, renderValueOrNoValue, renderValueOrYes, renderValueOrNo, renderValueNoThenEnabled } from '../utils/utils';
import WzSettingsGroup from "../util-components/configuration-settings-group";

const mainSettings = [
  { key: 'disabled', text: 'Integrity monitoring status', render: renderValueNoThenEnabled },
  { key: 'frequency', text: 'Interval (in seconds) to run the integrity scan' },
  { key: 'scan_time', text: 'Time of day to run integrity scans', render: renderValueOrNoValue },
  { key: 'scan_day', text: 'Day of the week to run integrity scans', render: renderValueOrNoValue },
  { key: 'auto_ignore', text: 'Ignore files that change too many times', render: renderValueOrNo },
  { key: 'alert_new_files', text: 'Alert when new files are created', render: renderValueOrNo },
  { key: 'scan_on_start', text: 'Scan on start' },
  { key: 'skip_nfs', text: 'Skip scan on CIFS/NFS mounts' },
  { key: 'remove_old_diff', text: 'Remove old local snapshots', render: renderValueOrYes },
  { key: 'restart_audit', text: 'Restart the Audit daemon' },
  { key: 'windows_audit_interval', text: 'Interval (in seconds) to check directories\' SACLs', render: renderValueOrDefault('300') },
  { key: 'prefilter_cmd', text: 'Command to prevent prelinking', render: renderValueOrNoValue },
];

class WzConfigurationIntegrityMonitoringGeneral extends Component{
  constructor(props){
    super(props);
  }
  render(){
    const { currentConfig } = this.props;
    return (
      <Fragment>
        <WzConfigurationTabSelector
          title='General'
          description='The settings shown below are applied globally'
          currentConfig={currentConfig}
          helpLinks={helpLinks}
        >
          <WzSettingsGroup
            config={currentConfig['syscheck-syscheck'].syscheck}
            items={mainSettings}
          />
        </WzConfigurationTabSelector>
      </Fragment>
    )
  }
}

export default WzConfigurationIntegrityMonitoringGeneral;