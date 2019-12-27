import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  
} from "@elastic/eui";

import WzNoConfig from "../util-components/no-config";
import WzConfigurationTabSelector from '../util-components/configuration-settings-tab-selector';
import WzConfigurationListSelector from '../util-components/configuration-settings-list-selector';
import { isString, isArray, renderValueOrDefault, renderValueOrNoValue } from '../utils/utils';
import { settingsListBuilder } from '../utils/builders';
import helpLinks from './help-links';

const mainSettings = [
  { key: 'name', text: 'Socket name', render: renderValueOrNoValue  },
  { key: 'location', text: 'Socket location', render: renderValueOrNoValue },
  { key: 'mode', text: 'UNIX socket protocol', render: renderValueOrDefault('udp') },
  { key: 'prefix', text: 'Prefix to place before the message', render: renderValueOrNoValue }
];

class WzConfigurationLogCollectionSockets extends Component{
  constructor(props){
    super(props);
  }
  render(){
    const { currentConfig } = this.props;
    const items = isArray(currentConfig['logcollector-socket'].target) ? settingsListBuilder(currentConfig['logcollector-socket'].target, 'name') : [];
    return (
      <Fragment>
        {currentConfig['logcollector-socket'] && isString(currentConfig['logcollector-socket']) && (
          <WzNoConfig error={currentConfig['logcollector-socket']} help={helpLinks}/>
          )}
        {currentConfig['logcollector-socket'] && !isString(currentConfig['logcollector-socket']) && !currentConfig['logcollector-socket'].target ? (
          <WzNoConfig error='not-present' help={helpLinks}/>
        ) : null}
        {currentConfig['logcollector-socket'] && !isString(currentConfig['logcollector-socket']) && currentConfig['logcollector-socket'].target && currentConfig['logcollector-socket'].target.length ? (
          <WzConfigurationTabSelector
            title='Output sockets'
            description='Define custom outputs to send log data'
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

export default WzConfigurationLogCollectionSockets;