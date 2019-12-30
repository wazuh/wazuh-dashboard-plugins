import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiButtonEmpty
} from "@elastic/eui";

import WzNoConfig from '../util-components/no-config';
import WzConfigurationTabSelector from '../util-components/configuration-settings-tab-selector';
import WzConfigurationSettingsGroup from '../util-components/configuration-settings-group';
import { isString } from '../utils/utils';

const helpLinks = [
  { text: 'Active response documentation', label: 'https://documentation.wazuh.com/current/user-manual/capabilities/active-response/index.html' },
  { text: 'Commands reference', label: 'https://documentation.wazuh.com/current/user-manual/reference/ossec-conf/commands.html' }
];

const mainSettings = [
  { field: 'name', label: 'Command name' },
  { field: 'executable', label: 'Name of executable file' },
  { field: 'expect', label: 'List of expected fields' },
  { field: 'extra_args', label: 'Extra arguments' },
  { field: 'timeout_allowed', label: 'Allow this command to be reverted' }
];

class WzConfigurationActiveResponseCommands extends Component{
  constructor(props){
    super(props);
    this.state = {
      selectedItem : 0
    };
  }
  selectItem(selectedItem){
    this.setState({ selectedItem });
  }
  render(){
    const { selectedItem } = this.state;
    const { currentConfig } = this.props;
    const selectedItemConfig = currentConfig['analysis-command'].command[selectedItem] ? {
      ...currentConfig['analysis-command'].command[selectedItem],
      timeout_allowed: currentConfig['analysis-command'].command[selectedItem].timeout_allowed ? 'yes' : 'no'
    } : {};
    return (
      <Fragment>
        {currentConfig['analysis-command'] && isString(currentConfig['analysis-command']) && (
          <WzNoConfig error={currentConfig['analysis-command']} help={helpLinks} />
          )}
        {currentConfig['analysis-command'] && !isString(currentConfig['analysis-command']) && currentConfig['analysis-command'].command && !currentConfig['analysis-command'].command.length && (
          <WzNoConfig error='not-present' help={helpLinks} />
          )}
        {/*wazuhNotReadyYet &&*/ (!currentConfig || !currentConfig['analysis-command']) && ( //TODO: wazuhnotreadyyet
          <WzNoConfig error='Wazuh not ready yet' help={helpLinks} />
        )}
        {currentConfig['analysis-command'] && !isString(currentConfig['analysis-command']) && currentConfig['analysis-command'].command && currentConfig['analysis-command'].command.length ? (
          <WzConfigurationTabSelector
            title='Command definitions'
            description='Find here all the currently defined commands used for Active response'
            currentConfig={currentConfig}
            helpLinks={helpLinks}>
              <EuiFlexGroup alignItems='flexStart'>
                <EuiFlexItem grow={false}>
                  <ul>
                    {currentConfig['analysis-command'].command.map((item, key) => (
                      <li key={`analysis-command-list-${key}`}>
                        <EuiButtonEmpty style={selectedItem === key ? {textDecoration: 'underline' } : {}} onClick={() => this.selectItem(key)}>{item.name}</EuiButtonEmpty>
                      </li>
                    ))}
                  </ul>
                </EuiFlexItem>
                <EuiFlexItem>
                  <WzConfigurationSettingsGroup 
                    config={selectedItemConfig}
                    items={mainSettings}
                  />
                </EuiFlexItem>
              </EuiFlexGroup>
            {/* <WzConfigurationSettingsGroup
              config={this.config.syscollector}
              items={mainSettings}
            />
            <WzConfigurationSettingsGroup
              title='Scan settings'
              description='Specific inventory scans to collect'
              config={this.config.syscollector}
              items={scanSettings}
            /> */}
          </WzConfigurationTabSelector>
        ) : null}
      </Fragment>
    )
  }
}

export default WzConfigurationActiveResponseCommands;