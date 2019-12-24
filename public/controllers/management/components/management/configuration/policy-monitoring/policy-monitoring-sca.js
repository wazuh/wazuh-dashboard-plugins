import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  EuiBasicTable
} from "@elastic/eui";

import WzNoConfig from '../util-components/no-config';
import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';
import WzConfigurationSettingsHeader from '../util-components/configuration-settings-tab-selector';
import WzConfigurationSettingsGroup from '../util-components/configuration-settings-tab-selector';
import helpLinks from './help-links';

const securitySettings = [
  { key: 'enabled', text: 'Security configuration assessment status'},
  { key: 'interval', text: 'Interval'},
  { key: 'scan_on_start', text: 'Scan on start'},
  { key: 'skip_nfs', text: 'Skip nfs'}
];

class WzPolicyMonitoringSCA extends Component{
  constructor(props){
    super(props);
    this.columns = [
      { field: 'policy', name: 'Name' }
    ]
  }
  render(){
    let { currentConfig } = this.props;
    currentConfig = currentConfig['wmodules-wmodules'].wmodules.find(module => module.sca);
    const securitySettingsConfig = {
      ...currentConfig['sca'],
      enabled: currentConfig['sca'].enabled === 'yes' ? 'enabled' : 'disabled'
    };
    return (
      <Fragment>
        {!currentConfig['sca'] ? (
          <WzNoConfig error='not-present' help={helpLinks}/>
        ) : (
          <WzConfigurationSettingsTabSelector title='Security configuration assessment status' currentConfig={currentConfig} helpLinks={helpLinks}>
            <WzConfigurationSettingsGroup
              config={securitySettingsConfig}
              items={securitySettings}
            />
            <WzConfigurationSettingsHeader
              title='Policies'
            />
            <EuiBasicTable
              items={currentConfig['sca'].policies.map(policy => ({ policy }))}
              columns={this.columns}/>
          </WzConfigurationSettingsTabSelector>
        )}
      </Fragment>
    )
  }
}

export default WzPolicyMonitoringSCA;