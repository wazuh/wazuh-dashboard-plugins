import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  
} from "@elastic/eui";

import WzConfigurationPath from '../util-components/configuration-path';
import WzNoConfig from '../util-components/no-config';
import WzConfigurationTabSelector from '../util-components/configuration-settings-tab-selector';
import WzConfigurationSettingsGroup from '../util-components/configuration-settings-group';
import withWzConfig from "../util-hocs/wz-config";
import { isString, renderValueNoThenEnabled } from '../utils/utils';

const mainSettings = [
  { key: 'disabled', text: 'Syscollector integration status', render: renderValueNoThenEnabled },
  { key: 'interval', text: 'Interval between system scans' },
  { key: 'scan-on-start', text: 'Scan on start' }
];

const scanSettings = [
  { key: 'hardware', text: 'Scan hardware info' },
  { key: 'processes', text: 'Scan current processes' },
  { key: 'os', text: 'Scan operating system infoo' },
  { key: 'packages', text: 'Scan installed packages' },
  { key: 'network', text: 'Scan network interfaces' },
  { key: 'ports', text: 'Scan listening network ports' },
  { key: 'ports_all', text: 'Scan all network ports' }
];

const helpLinks = [
  { text: 'Syscollector module documentation', href: 'https://documentation.wazuh.com/current/user-manual/capabilities/syscollector.html'},
  { text: 'Syscollector module reference', href: 'https://documentation.wazuh.com/current/user-manual/reference/ossec-conf/wodle-syscollector.html'}
];

class WzConfigurationInventory extends Component{
  constructor(props){
    super(props);
    this.config = this.props.currentConfig['wmodules-wmodules'].wmodules.find(item => item['syscollector']);
  }
  badgeEnabled(){
    return this.config.syscollector.disabled === 'no';
  }
  render(){
    const { currentConfig } = this.props;
    return (
      <Fragment>
        <WzConfigurationPath title='Inventory data' description='Gather relevant information about system OS, hardware, networking and packages' path='Inventory data' updateConfigurationSection={this.props.updateConfigurationSection} badge={this.badgeEnabled()}/>
        {currentConfig['wmodules-wmodules'] && isString(currentConfig['wmodules-wmodules']) && (
          <WzNoConfig error={currentConfig['wmodules-wmodules']} help={helpLinks}/>
        )}
        {currentConfig && !this.config.syscollector && !isString(currentConfig['wmodules-wmodules']) && (
          <WzNoConfig error='not-present' help={helpLinks}/>
        )}
        <WzConfigurationTabSelector
          title='Main settings'
          description='General settings applied to all the scans'
          currentConfig={this.config}
          helpLinks={helpLinks}>
          <WzConfigurationSettingsGroup
            config={this.config.syscollector}
            items={mainSettings}
          />
          <WzConfigurationSettingsGroup
            title='Scan settings'
            description='Specific inventory scans to collect'
            config={this.config.syscollector}
            items={scanSettings}
          />
        </WzConfigurationTabSelector>
      </Fragment>
    )
  }
}

const sections = [{ component: 'wmodules', configuration: 'wmodules' }];

export default withWzConfig('000', sections)(WzConfigurationInventory);