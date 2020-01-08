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
  EuiSpacer
} from "@elastic/eui";

import WzTabSelector from '../util-components/tab-selector';
import withWzConfig from '../util-hocs/wz-config';
import WzConfigurationAlertsGeneral from './alerts-general';
import WzConfigurationAlertsLabels from './alerts-labels';
import WzConfigurationAlertsEmailAlerts from './alerts-email-alerts';
import WzConfigurationAlertsEmailReports from './alerts-reports';
import WzConfigurationAlertsSyslogOutput from './alerts-syslog-output';
import { isString } from '../utils/utils';

import { connect } from 'react-redux';
import { compose } from 'redux';

class WzConfigurationAlerts extends Component{
  constructor(props){
    super(props);
  }
  render(){
    const { currentConfig, wazuhNotReadyYet } = this.props;
    return (
      <Fragment>
        {currentConfig['analysis-alerts'] && isString(currentConfig['analysis-alerts']) && (
          <WzNoConfig error={currentConfig['analysis-alerts']}/>
        )}
        {currentConfig['analysis-alerts'] && isString(currentConfig['analysis-alerts']) && !currentConfig['analysis-alerts'].alerts && (
          <WzNoConfig error='not-present'/>
        )}
        {wazuhNotReadyYet && (!currentConfig || !currentConfig['analysis-alerts']) && (
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

const mapStateToProps = (state) => ({
  wazuhNotReadyYet: state.configurationReducers.wazuhNotReadyYet
});

export default compose(
  withWzConfig(sections),
  connect(mapStateToProps)
)(WzConfigurationAlerts);
