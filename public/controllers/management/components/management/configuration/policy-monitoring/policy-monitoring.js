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

import withWzConfig from '../util-hocs/wz-config';
import WzTabSelector from "../util-components/tab-selector";

import WzConfigurationPolicyMonitoringGeneral from './policy-monitoring-general';
import WzConfigurationPolicyMonitoringSystemAudit from './policy-monitoring-system-audit';
import WzConfigurationPolicyMonitoringIgnored from "./policy-monitoring-ignored";
import WzConfigurationPolicyMonitoringSCA from "./policy-monitoring-sca";

class WzPolicyMonitoring extends Component{
  constructor(props){
    super(props);
  }
  componentDidMount(){
    this.props.updateBadge(this.badgeEnabled());
  }
  badgeEnabled(){
    return this.props.currentConfig['syscheck-rootcheck']
    && this.props.currentConfig['syscheck-rootcheck'].rootcheck
    && this.props.currentConfig['syscheck-rootcheck'].rootcheck.disabled
    && this.props.currentConfig['syscheck-rootcheck'].rootcheck.disabled === 'no'
  }
  render(){
    const { currentConfig } = this.props;
    return (
      <Fragment>
        <WzTabSelector>
          <div label='General'>
            <WzConfigurationPolicyMonitoringGeneral {...this.props} />
          </div>
          <div label='System audit'>
            <WzConfigurationPolicyMonitoringSystemAudit {...this.props} />
          </div>
          <div label='Ignored'>
            <WzConfigurationPolicyMonitoringIgnored {...this.props} />
          </div>
          <div label='SCA'>
            <WzConfigurationPolicyMonitoringSCA {...this.props} />
          </div>
        </WzTabSelector>
      </Fragment>
      
    )
  }
}

const sections = [{component:'syscheck',configuration:'rootcheck'}, {component:'wmodules',configuration:'wmodules'}]

export default withWzConfig(sections)(WzPolicyMonitoring);