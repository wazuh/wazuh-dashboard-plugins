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

import WzConfigurationSettingsTabSelector from "../util-components/configuration-settings-tab-selector";
import WzConfigurationSettingsGroup from "../util-components/configuration-settings-group";
import helpLinks from './help-links';

const mainSettings = [
  { field: 'disabled', label: 'Vulnerability detector status' },
  { field: 'interval', label: 'Interval between scan executions' },
  { field: 'run_on_start', label: 'Scan on start' },
  { field: 'ignore_time', label: 'Time to ignore already detected vulnerabilities' }
];

class WzConfigurationVulnerabilitiesGeneral extends Component{
  constructor(props){
    super(props);
  }
  render(){
    const { config } = this.props;
    return (
      <Fragment>
        <WzConfigurationSettingsTabSelector 
          title='Main settings'
          description='General settings applied to the vulnerability detector and its providers'
          currentConfig={config}
          helpLinks={helpLinks}>
            <WzConfigurationSettingsGroup 
              config={config['vulnerability-detector']}
              items={mainSettings}
            />
        </WzConfigurationSettingsTabSelector>
      </Fragment>
    )
  }
}

WzConfigurationVulnerabilitiesGeneral.propTypes = {
  currentConfig: PropTypes.object.isRequired
};

export default WzConfigurationVulnerabilitiesGeneral;