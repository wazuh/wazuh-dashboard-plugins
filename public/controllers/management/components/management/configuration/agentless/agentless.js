import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  
} from "@elastic/eui";
import WzConfigurationPath from "../util-components/configuration-path";
import withWzConfig from "../util-hocs/wz-config";
import WzNoConfig from "../util-components/no-config";
import WzConfigurationListSelector from '../util-components/configuration-settings-list-selector';
import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';
import { isString } from '../utils/utils';

const mainSettings = [
  { field: 'type', label: 'Agentless monitoring type' },
  { field: 'frequency', label: 'Interval (in seconds) between checks' },
  { field: 'host', label: 'Device username and hostname' },
  { field: 'state', label: 'Device check type' },
  { field: 'arguments', label: 'Pass these arguments to check' }
];

const helpLinks = [
  { text : 'How to monitor agentless devices', href: 'https://documentation.wazuh.com/current/user-manual/capabilities/agentless-monitoring/index.html'},
  { text : 'Agentless reference', href: 'https://documentation.wazuh.com/current/user-manual/reference/ossec-conf/agentless.html'}
];

class WzConfigurationAgentless extends Component{
  constructor(props){
    super(props);
  }
  render(){
    const { currentConfig } = this.props;
    return (
      <Fragment>
        <WzConfigurationPath title='Agentless' description='Run integrity checks on devices such as routers, firewalls and switches.' updateConfigurationSection={this.props.updateConfigurationSection} />
        {currentConfig['agentless-agentless'] && isString(currentConfig['agentless-agentless']) && (
          <WzNoConfig error={currentConfig['agentless-agentless']} help={helpLinks} />
        )}
        {/*wazuhNotReadyYet &&*/ (!currentConfig || !currentConfig['agentless-agentless']) && (
          <WzNoConfig error='Wazuh not ready yet' help={helpLinks} />
        )}
        {currentConfig['agentless-agentless'] && !isString(currentConfig['agentless-agentless']) && (
            <WzConfigurationSettingsTabSelector
              title='Devices list'
              description="List of monitored devices that don't use the agent"
              currentConfig={currentConfig}
              helpLinks={helpLinks}
            >
            <WzConfigurationListSelector
              items={currentConfig['agentless-agentless'].agentless}
              settings={mainSettings}
            />
          </WzConfigurationSettingsTabSelector>
        )}
      </Fragment>
    )
  }
}

const sections = [{component:'agentless',configuration:'agentless'}];

export default withWzConfig('000', sections)(WzConfigurationAgentless);