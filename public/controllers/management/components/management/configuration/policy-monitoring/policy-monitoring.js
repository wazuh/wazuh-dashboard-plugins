import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  
} from "@elastic/eui";

import withWzConfig from '../util-hocs/wz-config';
import TabSelector from "../util-components/tab-selector";
import WzConfigurationPolicyMonitoringGeneral from './policy-monitoring-general';
import WzConfigurationPath from "../util-components/configuration-path";
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
        <TabSelector>
          <div label='General'>
            <WzConfigurationPolicyMonitoringGeneral {...this.props} />
          </div>
          <div label='System audit'>
          </div>
          <div label='Ignored'>
            <WzConfigurationPolicyMonitoringIgnored {...this.props} />
          </div>
          <div label='SCA'>
            <WzConfigurationPolicyMonitoringSCA {...this.props} />
          </div>
        </TabSelector>
      </Fragment>
      
    )
  }
}

const sections = [{component:'syscheck',configuration:'rootcheck'}, {component:'wmodules',configuration:'wmodules'}]

export default withWzConfig('000', sections)(WzPolicyMonitoring);