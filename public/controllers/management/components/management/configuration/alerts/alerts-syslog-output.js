import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  EuiBasicTable,
  EuiSpacer
} from "@elastic/eui";

import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';
import WzNoConfig from '../util-components/no-config';
import { isString } from '../utils/wz-fetch';

const helpLinks = [
  { text: 'How to configure the syslog output', href: 'https://documentation.wazuh.com/current/user-manual/manager/manual-syslog-output.html'},
  { text: 'Syslog output reference', href: 'https://documentation.wazuh.com/current/user-manual/reference/ossec-conf/syslog-output.html' }
];

class WzConfigurationAlertsReports extends Component{
  constructor(props){
    super(props);
    this.columns = [ 
      { field: 'server', name: 'Server' },
      { field: 'port', name: 'Port' },
      { field: 'level', name: 'Level' },
      { field: 'format', name: 'Format' , render: (item) => item || 'default' },
      { field: 'use_fqdn', name: 'FQDN' , render: (item) => item || 'no'},
      { field: 'rule_id', name: 'Rule ID' , render: (item) => item || 'all'},
      { field: 'group', name: 'Group' , render: (item) => item || 'all'},
      { field: 'location', name: 'Location' , render: (item) => item || 'all'}
    ];
  }
  render(){
    //TODO: 
    const { currentConfig } = this.props;
    return (
      <Fragment>
        {currentConfig['csyslog-csyslog'] && isString(currentConfig['csyslog-csyslog']) && (
          <WzNoConfig error={currentConfig['csyslog-csyslog']} help={helpLinks}/>
        )}
        {currentConfig['csyslog-csyslog'] && !isString(currentConfig['csyslog-csyslog']) && (!currentConfig['csyslog-csyslog'].syslog_output || !currentConfig['csyslog-csyslog'].syslog_output.length) && (
          <Fragment>
            <EuiSpacer size='s'/>
            <WzNoConfig error='not-present' help={helpLinks}/>
          </Fragment>
        )}
        {/*wazuhNotReadyYet && */ (!currentConfig || !currentConfig['csyslog-csyslog']) && ( /* TODO: wazuhNotReady */
          <Fragment>
            <EuiSpacer size='s'/>
            <WzNoConfig error='Wazuh not ready yet' help={helpLinks}/>
          </Fragment>
        )}
        {currentConfig['csyslog-csyslog'] && !isString(currentConfig['csyslog-csyslog']) && currentConfig['csyslog-csyslog'].syslog_output && currentConfig['csyslog-csyslog'].syslog_output.length && (
          <WzConfigurationSettingsTabSelector
            title='Main settings'
            description='Output alerts to a syslog server'
            currentConfig={currentConfig} 
            helpLinks={helpLinks}>
            <ul>
              {currentConfig['monitor-reports'].email_alerts.map((item, key) => (
                <li key={`monitor-reports-${key}`} onClick={() => this.selectItem(key)}></li>
              ))}
            </ul>
            <EuiBasicTable
              columns={this.columns}
              items={currentConfig['csyslog-csyslog'].syslog_output}/>
          </WzConfigurationSettingsTabSelector>
        )}
      </Fragment>
    )
  }
}

export default WzConfigurationAlertsReports;