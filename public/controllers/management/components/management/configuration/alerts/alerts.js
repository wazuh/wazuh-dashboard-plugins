import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  EuiSpacer
} from "@elastic/eui";

import WzTabSelector from '../util-components/tab-selector';
import WzConfigurationPath from '../util-components/configuration-path';
import withWzConfig from '../util-hocs/wz-config';
import WzConfigurationAlertsGeneral from './alerts-general';
import WzConfigurationAlertsLabels from './alerts-labels';
import WzConfigurationAlertsEmailAlerts from './alerts-email-alerts';
import WzConfigurationAlertsEmailReports from './alerts-reports';
import WzConfigurationAlertsSyslogOutput from './alerts-syslog-output';
import { isString } from '../utils/utils';

class WzConfigurationAlerts extends Component{
  constructor(props){
    super(props);
  }
  render(){
    const { currentConfig } = this.props;
    return (
      <Fragment>
        <WzConfigurationPath title='Alerts' description='Settings related to the alerts and their format' path='Alerts' updateConfigurationSection={this.props.updateConfigurationSection}/>
        {currentConfig['analysis-alerts'] && isString(currentConfig['analysis-alerts']) && (
          <WzNoConfig error={currentConfig['analysis-alerts']}/>
        )}
        {currentConfig['analysis-alerts'] && isString(currentConfig['analysis-alerts']) && !currentConfig['analysis-alerts'].alerts && (
          <WzNoConfig error='not-present'/>
        )}
        {/*wazuhNotReadyYet &&*/ (!currentConfig || !currentConfig['analysis-alerts']) && (
          <WzNoConfig error='Wazuh not ready yet'/>
        )}
        <WzTabSelector>
          <div label="General">
            <WzConfigurationAlertsGeneral {...this.props}/>
          </div>
          <div label="Labels">
            <WzConfigurationAlertsLabels {...this.props}/>
          </div>
          <div label='Email alerts'>
            <WzConfigurationAlertsEmailAlerts {...this.props}/>
          </div>
          <div label='Reports'>
            <WzConfigurationAlertsEmailReports {...this.props}/>
          </div>
          <div label='Syslog output'>
            <WzConfigurationAlertsSyslogOutput {...this.props}/>
          </div>
        </WzTabSelector>
      </Fragment>
    )
  }
}

const sections = [
  {component:'analysis',configuration:'alerts'},
  {component:'analysis',configuration:'labels'},
  {component:'mail',configuration:'alerts'},
  {component:'monitor',configuration:'reports'},
  {component:'csyslog',configuration:'csyslog'}
];

export default withWzConfig('000', sections)(WzConfigurationAlerts);
