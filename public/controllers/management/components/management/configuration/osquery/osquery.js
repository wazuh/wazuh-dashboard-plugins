import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  EuiBasicTable
} from "@elastic/eui";

import WzConfigurationPath from '../util-components/configuration-path';
import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';
import withWzConfig from "../util-hocs/wz-config";
import WzConfigurationSettingsGroup from "../util-components/configuration-settings-group";
import WzNoConfig from "../util-components/no-config";
import { isString, isArray, renderValueNoThenEnabled } from '../utils/utils';
import WzConfigurationSettingsHeader from "../util-components/configuration-settings-header";

const mainSettings = [
  { field: 'disabled', label: 'Osquery integration status', render: renderValueNoThenEnabled },
  { field: 'run_daemon', label: 'Auto-run the Osquery daemon' },
  { field: 'bin_path', label: 'Path to the Osquery executable' },
  { field: 'log_path', label: 'Path to the Osquery results log file' },
  { field: 'config_path', label: 'Path to the Osquery configuration file' },
  { field: 'add_labels', label: 'Use defined labels as decorators' }
];

const helpLinks = [
  { text: 'Osquery module documentation', href: 'https://documentation.wazuh.com/current/user-manual/capabilities/osquery.html' },
  { text: 'Osquery module reference', href: 'https://documentation.wazuh.com/current/user-manual/reference/ossec-conf/wodle-osquery.html' }
];

const columns = [
  { field: 'name', name: 'Name' },
  { field: 'path', name: 'Path' }
];

class WzConfigurationOsquery extends Component{
  constructor(props){
    super(props);
    this.config = this.props.currentConfig['wmodules-wmodules'].wmodules.find(item => item['osquery']);
  }
  badgeEnabled(){
    return this.config.osquery.disabled === 'no';
  }
  render(){
    const { currentConfig } = this.props;
    return (
      <Fragment>
        <WzConfigurationPath title='Osquery' description='Expose an operating system as a high-performance relational database' path='Osquery' updateConfigurationSection={this.props.updateConfigurationSection} badge={this.badgeEnabled()}/>
        {currentConfig['wmodules-wmodules'] && isString(currentConfig['wmodules-wmodules']) && (
          <WzNoConfig error={currentConfig['wmodules-wmodules']} help={helpLinks}/>
        )}
        {currentConfig && !this.config.osquery && !isString(currentConfig['wmodules-wmodules']) && (
          <WzNoConfig error='not-present' help={helpLinks}/>
        )}
        <WzConfigurationSettingsTabSelector
          title='Main settings'
          description='General Osquery integration settings'
          currentConfig={this.config}
          helpLinks={helpLinks}>
          <WzConfigurationSettingsGroup
            config={this.config.osquery}
            items={mainSettings}
          />
          {this.config.osquery.packs && isArray(this.config.osquery.packs) && this.config.osquery.packs.length && (
            <Fragment>
              <WzConfigurationSettingsHeader
                title='Osquery packs'
                description='A pack contains multiple queries to quickly retrieve system information'
              />
              <EuiBasicTable 
                items={this.config.osquery.packs}
                columns={columns}
              />
            </Fragment>
          )}
        </WzConfigurationSettingsTabSelector>
      </Fragment>
    )
  }
}

const sections = [{ component: 'wmodules', configuration: 'wmodules' }];

export default withWzConfig('000', sections)(WzConfigurationOsquery);