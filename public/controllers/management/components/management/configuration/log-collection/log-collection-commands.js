import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  
} from "@elastic/eui";

import WzNoConfig from "../util-components/no-config";
import WzConfigurationTabSelector from '../util-components/configuration-settings-tab-selector';
import WzConfigurationListSelector from '../util-components/configuration-settings-list-selector';
import { isString, renderValueOrDefault, renderValueOrNoValue } from '../utils/utils';
import { settingsListBuilder } from '../utils/builders';
import helpLinks from './help-links';

const mainSettings = [
  { field: 'logformat', label: 'Log format' },
  { field: 'command', label: 'Run this command', render: renderValueOrNoValue },
  { field: 'alias', label: 'Command alias', render: renderValueOrNoValue },
  { field: 'frequency', label: 'Interval between command executions', render: renderValueOrNoValue },
  { field: 'target', label: 'Redirect output to this socket', render: renderValueOrDefault('agent') },
];

class WzConfigurationLogCollectionCommands extends Component{
  constructor(props){
    super(props);
  }
  render(){
    const { currentConfig } = this.props;
    const items = settingsListBuilder(currentConfig['logcollector-localfile']['localfile-commands'], ['alias','command'])
    return (
      <Fragment>
        {currentConfig['logcollector-localfile'] && isString(currentConfig['logcollector-localfile']) && (
          <WzNoConfig error={currentConfig['logcollector-localfile']} help={helpLinks}/>
        )}
        {currentConfig['logcollector-localfile'] && !isString(currentConfig['logcollector-localfile']) && !(currentConfig['logcollector-localfile']['localfile'] || []).length ? (
          <WzNoConfig error='not-present' help={helpLinks}/>
        ) : null}
        {currentConfig['logcollector-localfile'] && !isString(currentConfig['logcollector-localfile']) && currentConfig['logcollector-localfile']['localfile-commands'] && currentConfig['logcollector-localfile']['localfile-commands'].length ? (
          <WzConfigurationTabSelector
            title='Command monitoring'
            description='All output from these commands will be read as one or more log messages depending on whether command or full_command is used.'
            currentConfig={currentConfig}
            helpLinks={helpLinks}>
              <WzConfigurationListSelector
                items={items}
                settings={mainSettings}
              />
            </WzConfigurationTabSelector>
        ) : null}
      </Fragment>
    )
  }
}

export default WzConfigurationLogCollectionCommands;