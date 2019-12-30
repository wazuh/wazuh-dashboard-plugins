import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  EuiBasicTable
} from "@elastic/eui";

import WzConfigurationTabSelector from '../util-components/configuration-settings-tab-selector';
import WzConfigurationSettingsGroup from '../util-components/configuration-settings-group';
import WzNoConfig from '../util-components/no-config';
import helpLinks from './help-links';

const mainSettings = [
  { field: 'restart_audit', label: 'Restart audit' },
  { field: 'startup_healthcheck', label: 'Startup healthcheck' },
];

const columns = [
  { field: 'audit_key', name: 'Keys' }
];

class WzConfigurationIntegrityMonitoringWhoData extends Component{
  constructor(props){
    super(props);
  }
  render(){
    const { currentConfig } = this.props;
    return (
      <Fragment>
        {currentConfig && currentConfig['syscheck-syscheck'] && currentConfig['syscheck-syscheck'].syscheck && !currentConfig['syscheck-syscheck'].syscheck.ignore && (
          <WzNoConfig error='not-present' help={helpLinks} />
        )}
        {currentConfig && currentConfig['syscheck-syscheck'] && currentConfig['syscheck-syscheck'].syscheck && currentConfig['syscheck-syscheck'].syscheck.ignore && (
          <WzConfigurationTabSelector
            title='Who-data audit keys'
            description="Wazuh will include in its FIM baseline those events being monitored by Audit using audit_key."
            currentConfig={currentConfig}
            helpLinks={helpLinks}
          >
          <WzConfigurationSettingsGroup 
            config={currentConfig['syscheck-syscheck'].syscheck.whodata}
            items={mainSettings}
          />
          {currentConfig['syscheck-syscheck'].syscheck.whodata.audit_key && (
            <EuiBasicTable
              items={currentConfig['syscheck-syscheck'].syscheck.whodata.audit_key.map(item => ({audit_key: item}))}
              columns={columns}
            />
          )}
        </WzConfigurationTabSelector>
        )}
      </Fragment>
    )
  }
}

export default WzConfigurationIntegrityMonitoringWhoData;