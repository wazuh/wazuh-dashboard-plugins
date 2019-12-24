import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  
} from "@elastic/eui";

import WzConfigurationTabSelector from "../util-components/configuration-settings-tab-selector";
import WzConfigurationSettingsGroup from "../util-components/configuration-settings-group";
import helpLinks from './help-links';

const mainSettings = [
  { key: 'disabled', text: 'CIS-CAT integration status' },
  { key: 'timeout', text: 'Timeout (in seconds) for scan executions' },
  { key: 'java_path', text: 'Path to Java executable directory' },
  { key: 'ciscat_path', text: 'Path to CIS-CAT executable directory' }
];

const schedulingSettings = [
  { key: 'interval', text: 'Interval between scan executions' },
  { key: 'scan-on-start', text: 'Scan on start' },
  { key: 'day', text: 'Day of the month to run scans' },
  { key: 'wday', text: 'Day of the week to run scans' },
  { key: 'time', text: 'Time of the day to run scans' }
];

class WzConfigurationCisCatGeneral extends Component{
  constructor(props){
    super(props);
  }
  render(){
    const { config } = this.props;
    return (
      <Fragment>
        <WzConfigurationTabSelector 
          title='Main settings'
          description='General settings applied to all benchmarks'
          currentConfig={config}
          helpLinks={helpLinks}>
            <WzConfigurationSettingsGroup 
              config={config['cis-cat']}
              items={mainSettings}
            />
            <WzConfigurationSettingsGroup
              title='Scheduling settings'
              description='Customize CIS-CAT scans scheduling'
              config={config['cis-cat']}
              items={schedulingSettings}
            />
        </WzConfigurationTabSelector>

      </Fragment>
    )
  }
}

export default WzConfigurationCisCatGeneral;