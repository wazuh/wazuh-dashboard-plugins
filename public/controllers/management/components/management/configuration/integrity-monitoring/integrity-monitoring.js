import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  
} from "@elastic/eui";

import WzConfigurationPath from '../util-components/configuration-path';
import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';
import withWzConfig from "../util-hocs/wz-config";
import WzConfigurationSettingsGroup from "../util-components/configuration-settings-group";
import WzNoConfig from "../util-components/no-config";
import { isString, isArray } from '../utils/utils';
import WzConfigurationSettingsHeader from "../util-components/configuration-settings-header";
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
        <WzConfigurationPath title='Integrity monitoring' description='Identify changes in content, permissions, ownership and attributes of files' updateConfigurationSection={this.props.updateConfigurationSection} badge={this.badgeEnabled()}/>
        {currentConfig['syscheck-syscheck'] && isString(currentConfig['syscheck-syscheck']) && (
          <WzNoConfig error={currentConfig['syscheck-syscheck']} help={helpLinks}/>
        )}
        {currentConfig['syscheck-syscheck'] && !isString(currentConfig['syscheck-syscheck']) && !currentConfig['syscheck-syscheck'].syscheck && (
          <WzNoConfig error='not-present' help={helpLinks}/>
        )}
        {currentConfig['syscheck-syscheck'] && !isString(currentConfig['syscheck-syscheck']) && currentConfig['syscheck-syscheck'].syscheck && (
          <WzTabSelector>
            <div label='General'>
              <WzConfigurationIntegrityMonitoringGeneral currentConfig={currentConfig} />
            </div>
            <div label='Monitored'>
              <WzConfigurationIntegrityMonitoringMonitored currentConfig={currentConfig} />
            </div>
            <div label='Ignored'>
              <WzConfigurationIntegrityMonitoringIgnored currentConfig={currentConfig} />

            </div>
            <div label='No diff'>
              <WzConfigurationIntegrityMonitoringNoDiff currentConfig={currentConfig} />
            </div>
            <div label='Who-data'>
              <WzConfigurationIntegrityMonitoringWhoData currentConfig={currentConfig} />
            </div>
          </WzTabSelector>
        )}
      </Fragment>
    )
  }
}

const sections = [{component:'syscheck',configuration:'syscheck'}];

export default withWzConfig('000', sections)(WzConfigurationIntegrityMonitoring);