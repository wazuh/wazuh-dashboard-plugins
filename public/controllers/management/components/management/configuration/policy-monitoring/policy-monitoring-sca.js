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
  EuiBasicTable
} from "@elastic/eui";

import WzNoConfig from '../util-components/no-config';
import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';
import WzConfigurationSettingsHeader from '../util-components/configuration-settings-header';
import WzConfigurationSettingsGroup from '../util-components/configuration-settings-group';
import helpLinks from './help-links';

const securitySettings = [
  { field: 'enabled', label: 'Security configuration assessment status'},
  { field: 'interval', label: 'Interval'},
  { field: 'scan_on_start', label: 'Scan on start'},
  { field: 'skip_nfs', label: 'Skip nfs'}
];

const columns = [
  { field: 'policy', name: 'Name' }
];

class WzPolicyMonitoringSCA extends Component{
  constructor(props){
    super(props);
  }
  render(){
    let { currentConfig } = this.props;
    currentConfig = currentConfig['wmodules-wmodules'].wmodules.find(wmodule => wmodule.sca);
    const securitySettingsConfig = {
      ...currentConfig['sca'],
      enabled: currentConfig['sca'].enabled === 'yes' ? 'enabled' : 'disabled'
    };
    return (
      <Fragment>
        {!currentConfig['sca'] ? (
          <WzNoConfig error='not-present' help={helpLinks}/>
        ) : (
          <WzConfigurationSettingsTabSelector
            title='Security configuration assessment status'
            currentConfig={currentConfig}
            helpLinks={helpLinks}>
            <WzConfigurationSettingsGroup
              config={securitySettingsConfig}
              items={securitySettings}
            />
            <WzConfigurationSettingsHeader
              title='Policies'
            />
            <EuiBasicTable
              items={currentConfig['sca'].policies.map(policy => ({ policy }))}
              columns={columns}/>
          </WzConfigurationSettingsTabSelector>
        )}
      </Fragment>
    )
  }
}

export default WzPolicyMonitoringSCA;