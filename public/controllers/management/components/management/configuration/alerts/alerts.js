import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  EuiSpacer
} from "@elastic/eui";

import TabSelector from '../util-components/tab-selector';
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
    this.container = (content) => (
      <div>
        <EuiSpacer size='xs'/>
        <div>
          {content}
        </div>
      </div>
    );
  }
  render(){
    return (
      <Fragment>
        <WzConfigurationPath title='Alerts' description='Settings related to the alerts and their format' path='Alerts' updateConfigurationSection={this.props.updateConfigurationSection}/>
        <TabSelector container={this.container}>
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
        </TabSelector>
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

export default withWzConfig('000', sections, null, ({ error }) => {
  return ( //TODO: remove this and insert inner Component
    <Fragment>
      {error.alerts && <WzNoConfig error={error.alerts}/>}
      {error.notPresent && (
        <Fragment>
          <EuiSpacer size='s'/>
          <WzNoConfig error={error.notPresent}/>}
        </Fragment>
      )}
      {error.wazuhNotReadyYet && (
        <Fragment>
          <EuiSpacer size='s'/>
          <WzNoConfig error={error.wazuhNotReadyYet}/>
        </Fragment>
      )}
    </Fragment>
  )
}, (currentConfig) => {
  let error = false;
  if(currentConfig['analysis-alerts'] && isString(currentConfig['analysis-alerts'])){
    error = error || {};
    error.alerts = currentConfig['analysis-alerts'];
  };
  if(currentConfig['analysis-alerts'] && isString(currentConfig['analysis-alerts']) && !currentConfig['analysis-alerts'].alerts){
    error = error || {};
    error.notPresent = 'not-present';
  };
  if(/*wazuhNotReadyYet &&*/ (!currentConfig || !currentConfig['analysis-alerts'])){ // TODO: wazuhNotReadyYet
    error = error || {};
    error.wazuhNotReadyYet = 'Wazuh not ready yet';
  };
  return error

})(WzConfigurationAlerts);
