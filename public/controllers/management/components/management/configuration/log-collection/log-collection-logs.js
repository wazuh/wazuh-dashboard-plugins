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
  { key: 'logformat', text: 'Log format', render: renderValueOrNoValue },
  { key: 'file', text: 'Log location', render: renderValueOrNoValue },
  { key: 'labels', text: 'Only receive logs occured after start', render: renderValueOrNoValue },
  { key: 'target', text: 'Redirect output to this socket', render: renderValueOrDefault('agent') },
];

class WzConfigurationLogCollectionLogs extends Component{
  constructor(props){
    super(props);
  }
  render(){
    const { currentConfig } = this.props;
    const items = settingsListBuilder(currentConfig['logcollector-localfile']['localfile-logs'], 'file');
    return (
      <Fragment>
        {currentConfig['logcollector-localfile'] && isString(currentConfig['logcollector-localfile']) && (
          <WzNoConfig error={currentConfig['logcollector-localfile']} help={helpLinks}/>
          )}
        {currentConfig['logcollector-localfile'] && !isString(currentConfig['logcollector-localfile']) && !(currentConfig['logcollector-localfile']['localfile-logs'] || []).length ? (
          <WzNoConfig error='not-present' help={helpLinks}/>
        ) : null}
        {currentConfig['logcollector-localfile'] && !isString(currentConfig['logcollector-localfile']) && currentConfig['logcollector-localfile']['localfile-logs'] && currentConfig['logcollector-localfile']['localfile-logs'].length ? (
          <WzConfigurationTabSelector
          title='Logs files'
          description='List of log files that will be analyzed'
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

export default WzConfigurationLogCollectionLogs;