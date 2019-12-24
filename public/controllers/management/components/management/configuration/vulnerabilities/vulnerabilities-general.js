import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  
} from "@elastic/eui";

import WzConfigurationTabSelector from "../util-components/configuration-settings-tab-selector";
import WzConfigurationSettingsGroup from "../util-components/configuration-settings-group";
import helpLinks from './help-links';

const mainSettings = [
  { key: 'disabled', text: 'Vulnerability detector status' },
  { key: 'interval', text: 'Interval between scan executions' },
  { key: 'run_on_start', text: 'Scan on start' },
  { key: 'ignore_time', text: 'Time to ignore already detected vulerabilities' }
];

class WzConfigurationVulnerabilitiesGeneral extends Component{
  constructor(props){
    super(props);
    console.log('vul general', this.props)
  }
  render(){
    const { config } = this.props;
    return (
      <Fragment>
        <WzConfigurationTabSelector 
          title='Main settings'
          description='General settings applied to the vulnerability detector and its providers'
          currentConfig={config}
          helpLinks={helpLinks}>
            <WzConfigurationSettingsGroup 
              config={config['vulnerability-detector']}
              items={mainSettings}
            />
        </WzConfigurationTabSelector>
      </Fragment>
    )
  }
}

export default WzConfigurationVulnerabilitiesGeneral;