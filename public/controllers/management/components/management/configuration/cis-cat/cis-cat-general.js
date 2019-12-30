import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  
} from "@elastic/eui";

import WzConfigurationTabSelector from "../util-components/configuration-settings-tab-selector";
import WzConfigurationSettingsGroup from "../util-components/configuration-settings-group";
import helpLinks from './help-links';

const mainSettings = [
  { field: 'disabled', label: 'CIS-CAT integration status' },
  { field: 'timeout', label: 'Timeout (in seconds) for scan executions' },
  { field: 'java_path', label: 'Path to Java executable directory' },
  { field: 'ciscat_path', label: 'Path to CIS-CAT executable directory' }
];

const schedulingSettings = [
  { field: 'interval', label: 'Interval between scan executions' },
  { field: 'scan-on-start', label: 'Scan on start' },
  { field: 'day', label: 'Day of the month to run scans' },
  { field: 'wday', label: 'Day of the week to run scans' },
  { field: 'time', label: 'Time of the day to run scans' }
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