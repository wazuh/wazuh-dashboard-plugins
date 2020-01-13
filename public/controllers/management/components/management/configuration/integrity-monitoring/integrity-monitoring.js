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
  
} from "@elastic/eui";

import withWzConfig from "../util-hocs/wz-config";
import WzNoConfig from "../util-components/no-config";
import { isString } from '../utils/utils';
import WzTabSelector from '../util-components/tab-selector';

import WzConfigurationIntegrityMonitoringGeneral from './integrity-monitoring-general';
import WzConfigurationIntegrityMonitoringMonitored from './integrity-monitoring-monitored';
import WzConfigurationIntegrityMonitoringIgnored from './integrity-monitoring-ignored';
import WzConfigurationIntegrityMonitoringNoDiff from './integrity-monitoring-no-diff';
import WzConfigurationIntegrityMonitoringWhoData from './integrity-monitoring-who-data';

class WzConfigurationIntegrityMonitoring extends Component{
  constructor(props){
    super(props);
  }
  componentDidMount(){
    this.props.updateBadge(this.badgeEnabled());
  }
  badgeEnabled(){
    return this.props.currentConfig['syscheck-syscheck']
    && this.props.currentConfig['syscheck-syscheck'].syscheck
    && this.props.currentConfig['syscheck-syscheck'].syscheck.disabled
    && this.props.currentConfig['syscheck-syscheck'].syscheck.disabled === 'no'
  }
  render(){
    const { currentConfig } = this.props;
    return (
      <Fragment>
        {currentConfig['syscheck-syscheck'] && isString(currentConfig['syscheck-syscheck']) && (
          <WzNoConfig error={currentConfig['syscheck-syscheck']} help={helpLinks}/>
        )}
        {currentConfig['syscheck-syscheck'] && !isString(currentConfig['syscheck-syscheck']) && !currentConfig['syscheck-syscheck'].syscheck && (
          <WzNoConfig error='not-present' help={helpLinks}/>
        )}
        {currentConfig['syscheck-syscheck'] && !isString(currentConfig['syscheck-syscheck']) && currentConfig['syscheck-syscheck'].syscheck && (
          <WzTabSelector>
            <div label='General'>
              <WzConfigurationIntegrityMonitoringGeneral {...this.props} />
            </div>
            <div label='Monitored'>
              <WzConfigurationIntegrityMonitoringMonitored {...this.props} />
            </div>
            <div label='Ignored'>
              <WzConfigurationIntegrityMonitoringIgnored {...this.props} />

            </div>
            <div label='No diff'>
              <WzConfigurationIntegrityMonitoringNoDiff {...this.props} />
            </div>
            <div label='Who-data'>
              <WzConfigurationIntegrityMonitoringWhoData {...this.props} />
            </div>
          </WzTabSelector>
        )}
      </Fragment>
    )
  }
}

const sections = [{component:'syscheck',configuration:'syscheck'}];

export default withWzConfig(sections)(WzConfigurationIntegrityMonitoring);