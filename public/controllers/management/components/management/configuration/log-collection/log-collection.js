import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  
} from "@elastic/eui";

import WzConfigurationPath from '../util-components/configuration-path';
import WzTabSelector from '../util-components/tab-selector';
import WzConfigurationLogCollectionLogs from './log-collection-logs';
import WzConfigurationLogCollectionCommands from './log-collection-commands';
import WzConfigurationLogCollectionSockets from './log-collection-sockets';
import withWzConfig from "../util-hocs/wz-config";

class WzConfigurationLogCollection extends Component{
  constructor(props){
    super(props);
  }
  //TODO: build localfile-logs and localfile-commands? and insert on currentConfig
  render(){
    let { currentConfig } = this.props;
    currentConfig = {
      ...currentConfig,
      'logcollector-localfile' : {
        ...currentConfig['logcollector-localfile'],
        'localfile-logs': currentConfig['logcollector-localfile'].localfile.filter(item => item.file),
        'localfile-commands': currentConfig['logcollector-localfile'].localfile.filter(item => item.command)
      }
    }
    return (
      <Fragment>
        <WzConfigurationPath title='Log collection' description='Log analysis from text files, Windows events or syslog outputs' updateConfigurationSection={this.props.updateConfigurationSection}/>
        <WzTabSelector>
          <div label='Logs'>
            <WzConfigurationLogCollectionLogs currentConfig={currentConfig} />
          </div>
          <div label='Commands'>
            <WzConfigurationLogCollectionCommands currentConfig={currentConfig} />
          </div>
          <div label='Sockets'>
          <WzConfigurationLogCollectionSockets currentConfig={currentConfig} />
          </div>
        </WzTabSelector>
      </Fragment>
    )
  }
}

const sections = [{component:'logcollector',configuration:'localfile'},{component:'logcollector',configuration:'socket'}];

export default withWzConfig('000', sections)(WzConfigurationLogCollection);