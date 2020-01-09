import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  
} from "@elastic/eui";

import WzNoConfig from "../util-components/no-config";
import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';
import WzConfigurationSettingsGroup from '../util-components/configuration-settings-group';

import withWzConfig from '../util-hocs/wz-config';

import { isString, renderValueNoThenEnabled, renderValueOrDefault } from '../utils/utils';

const helpLinks = [
  { text: 'Anti-flooding mechanism', href: 'https://documentation.wazuh.com/current/user-manual/capabilities/antiflooding.html' },
  { text: 'Client buffer reference', href: 'https://documentation.wazuh.com/current/user-manual/reference/ossec-conf/agent_buffer.html' }
];

const mainSettings = [
  { field: 'disabled', label: 'Buffer status', render: renderValueNoThenEnabled},
  { field: 'queue_size', label: 'Queue size', render: renderValueOrDefault('5000')},
  { field: 'events_per_second', label: 'Events per second', render: renderValueOrDefault('500')},
];

class WzConfigurationClientBuffer extends Component{
  constructor(props){
    super(props);
  }
  render(){
    const { currentConfig } = this.props;
    return (
      <Fragment>
        {currentConfig['agent-buffer'] && isString(currentConfig['agent-buffer']) && (
          <WzNoConfig error={currentConfig['agent-buffer']} help={helpLinks}/>
          )}
        {currentConfig['agent-buffer'] && !isString(currentConfig['agent-buffer']) && !currentConfig['agent-buffer'].buffer && (
          <WzNoConfig error='not-present' help={helpLinks}/>
        )}
        {currentConfig['agent-buffer'] && !isString(currentConfig['agent-buffer']) && currentConfig['agent-buffer'].buffer && (
          <WzConfigurationSettingsTabSelector
            title='Main settings'
            description='These settings determine the event processing rate for the agent'
            currentConfig={currentConfig}
            helpLinks={helpLinks}>
              <WzConfigurationSettingsGroup
                config={currentConfig['agent-buffer'].buffer}
                items={mainSettings}
              />
          </WzConfigurationSettingsTabSelector>
        )}
      </Fragment>
    )
  }
}

const sections = [{component:'agent',configuration:'buffer'}];

export default withWzConfig(sections)(WzConfigurationClientBuffer);