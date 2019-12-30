import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  
} from "@elastic/eui";

import WzConfigurationSettingsGroup from '../util-components/configuration-settings-group';
import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';

const mainSettings = [
  { field: 'log_alert_level', label: 'Minimum severity level to store the alert'},
  { field: 'email_alert_level', label: 'Minimum severity level to send the alert by email' },
  { field: 'use_geoip', label: 'Enable GeoIP lookups' }
];
const helpLinks = [
  { text: 'Use cases about alerts generation', href: 'https://documentation.wazuh.com/current/getting-started/use-cases.html' },
  { text: 'Alerts reference', href: 'https://documentation.wazuh.com/current/user-manual/reference/ossec-conf/alerts.html' }
];

class WzConfigurationAlertsGeneral extends Component{
  constructor(props){
    super(props);
  }
  render(){
    const { currentConfig } = this.props;
    const mainSettingsConfig = {
      log_alert_level: currentConfig['analysis-alerts'].alerts.log_alert_level,
      email_alert_level: currentConfig['analysis-alerts'].alerts.email_alert_level,
      use_geoip: currentConfig['analysis-alerts'].use_geoip || 'no'
    };
    return (
      <WzConfigurationSettingsTabSelector
        title='Main settings'
        description='General alert settings'
        currentConfig={currentConfig}
        helpLinks={helpLinks}>
          <WzConfigurationSettingsGroup
            config={mainSettingsConfig}
            items={mainSettings}
          />
      </WzConfigurationSettingsTabSelector>
    )
  }
}

export default WzConfigurationAlertsGeneral;