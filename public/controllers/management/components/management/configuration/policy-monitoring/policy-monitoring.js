import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  
} from "@elastic/eui";

import withWzConfig from '../util-hocs/wz-config';
import WzTabSelector from "../util-components/tab-selector";
import WzConfigurationPath from "../util-components/configuration-path";

import WzConfigurationPolicyMonitoringGeneral from './policy-monitoring-general';
import WzConfigurationPolicyMonitoringSystemAudit from './policy-monitoring-system-audit';
import WzConfigurationPolicyMonitoringIgnored from "./policy-monitoring-ignored";
import WzConfigurationPolicyMonitoringSCA from "./policy-monitoring-sca";

class WzPolicyMonitoring extends Component{
  constructor(props){
    super(props);
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
        <WzConfigurationPath title='Policy monitoring' description='Configuration to ensure compliance with security policies, standards and hardening guides' path='Policy monitoring' updateConfigurationSection={this.props.updateConfigurationSection} badge={this.badgeEnabled()}/>
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

export default withWzConfig('000', sections)(WzPolicyMonitoring);