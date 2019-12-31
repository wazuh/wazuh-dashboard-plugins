import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  
} from "@elastic/eui";

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

export default WzConfigurationVulnerabilitiesGeneral;