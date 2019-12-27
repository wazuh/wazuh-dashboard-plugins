import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  
} from "@elastic/eui";

import WzConfigurationPath from "../util-components/configuration-path";
import WzNoConfig from '../util-components/no-config';
import WzConfigurationTabSelector from "../util-components/configuration-settings-tab-selector";
import WzConfigurationSettingsListSelector from '../util-components/configuration-settings-list-selector';
import withWzConfig from "../util-hocs/wz-config";
import { isString } from '../utils/utils';
import { settingsListBuilder } from '../utils/builders';

const helpLinks = [
  { text: 'Command module reference', href: 'https://documentation.wazuh.com/current/user-manual/reference/ossec-conf/wodle-command.html' }
];

const mainSettings = [
  { key: 'disabled', text: 'Command status' },
  { key: 'tag', text: 'Command name' },
  { key: 'command', text: 'Command to execute' },
  { key: 'interval', text: 'Interval between executions' },
  { key: 'run_on_start', text: 'Run on start' },
  { key: 'ignore_output', text: 'Ignore command output' },
  { key: 'timeout', text: 'Timeout (in seconds) to wait for execution' },
  { key: 'verify_md5', text: 'Verify MD5 sum' },
  { key: 'verify_sha1', text: 'Verify SHA1 sum' },
  { key: 'verify_sha256', text: 'Verify SHA256 sum' },
  { key: 'skip_verification', text: 'Ignore checksum verification' }
];

class WzConfigurationCommands extends Component{
  constructor(props){
    super(props);
    this.config = this.props.currentConfig['wmodules-wmodules'].wmodules.find(item => item['commands']);
  }
  render(){
    const { currentConfig } = this.props;
    const items = this.config ? settingsListBuilder(this.config, 'tag') : [];
    return (
      <Fragment>
        <WzConfigurationPath title='Commands' decription='Configuration options of the Command wodle' path='Commands' updateConfigurationSection={this.props.updateConfigurationSection} />
        {currentConfig['wmodules-wmodules'] && isString(currentConfig['wmodules-wmodules']) && (
          <WzNoConfig error={currentConfig['wmodules-wmodules']} help={helpLinks}/>
        )}
        {currentConfig && !this.config && !isString(currentConfig['wmodules-wmodules']) && (
          <WzNoConfig error='not-present' help={helpLinks}/>
        )}
        {currentConfig && this.config && !isString(currentConfig['wmodules-wmodules']) && currentConfig.commands.length ? (
          <WzConfigurationTabSelector
            title='Command definitions'
            description='Find here all the currently defined commands'
            currentConfig={this.config}
            helpLinks={helpLinks}>
              <WzConfigurationSettingsListSelector
                items={items}
                settings={mainSettings}
              />
          </WzConfigurationTabSelector>
        ) : null}
      </Fragment>
    )
  }
}

const sections = [{ component: 'wmodules', configuration: 'wmodules' }];

export default withWzConfig('000', sections)(WzConfigurationCommands);