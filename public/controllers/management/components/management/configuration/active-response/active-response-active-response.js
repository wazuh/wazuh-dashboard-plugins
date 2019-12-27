import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  
} from "@elastic/eui";

import WzNoConfig from '../util-components/no-config';
import WzConfigurationTabSelector from '../util-components/configuration-settings-tab-selector';
import WzConfigurationSettingsGroup from '../util-components/configuration-settings-group';
import WzConfigurationSettingsListSelector from '../util-components/configuration-settings-list-selector';
import { isString, renderValueNoThenEnabled } from '../utils/utils';

const mainSettings = [
  { key: 'disabled', text: 'Status of this active response', render: renderValueNoThenEnabled },
  { key: 'command', text: 'Command to execute' },
  { key: 'location', text: 'Execute the command on this location' },
  { key: 'agent_id', text: 'Agent ID on which execute the command' },
  { key: 'level', text: 'Match to this severity level or above' },
  { key: 'rules_group', text: 'Match to one of these groups' },
  { key: 'rules_id', text: 'Match to one of these rule IDs' },
  { key: 'timeout', text: 'Timeout (in seconds) before reverting' }
];

const helpLinks = [
  { text: 'Active response documentation', href: 'https://documentation.wazuh.com/current/user-manual/capabilities/active-response/index.html' },
  { text: 'Active response reference', href: 'https://documentation.wazuh.com/current/user-manual/reference/ossec-conf/active-response.html' }
];

class WzConfigurationActiveResponseActiveResponse extends Component{
  constructor(props){
    super(props);
  }
  render(){
    const { currentConfig } = this.props;
    const items = currentConfig['analysis-active_response']['active-response'].map((item, key) => ({
      button: item.command,
      data: item
    }))
    return (
      <Fragment>
        {currentConfig['analysis-active_response'] && isString(currentConfig['analysis-active_response']) && (
          <WzNoConfig error={currentConfig['analysis-active_response']} help={helpLinks} />
        )}
        {currentConfig['analysis-active_response'] && !isString(currentConfig['analysis-active_response']) && currentConfig['analysis-active_response']['active-response'] && !currentConfig['analysis-active_response']['active-response'].length && (
          <WzNoConfig error='not-present' help={helpLinks} />
        )}
        {/*wazuhNotReadyYet &&*/ (!currentConfig || !currentConfig['analysis-active_response']) && (
          <WzNoConfig error={currentConfig['com-active-response']} help={helpLinks} />
        )}
        {currentConfig['analysis-active_response'] && !isString(currentConfig['analysis-active_response']) && currentConfig['analysis-active_response']['active-response'].length ? (
          <WzConfigurationTabSelector
            title='Active response settings'
            description='Find here all the currently defined Active responses'
            currentConfig={currentConfig['analysis-active_response']['active-response']}
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

export default WzConfigurationActiveResponseActiveResponse;