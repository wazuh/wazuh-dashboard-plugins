/*
 * Wazuh app - React component for show configuration of log collection.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { Component, Fragment } from 'react';

import WzTabSelector, {
  WzTabSelectorTab
} from '../util-components/tab-selector';
import WzConfigurationLogCollectionLogs from './log-collection-logs';
import WzConfigurationLogCollectionCommands from './log-collection-commands';
import WzConfigurationLogCollectionSockets from './log-collection-sockets';
import withWzConfig from '../util-hocs/wz-config';
import { isString } from '../utils/utils';

class WzConfigurationLogCollection extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    let { currentConfig, agent } = this.props;
    currentConfig =
      currentConfig['logcollector-localfile'] &&
      !isString(currentConfig['logcollector-localfile'])
        ? {
            ...currentConfig,
            'logcollector-localfile': {
              ...currentConfig['logcollector-localfile'],
              'localfile-logs': currentConfig[
                'logcollector-localfile'
              ].localfile.filter(item => typeof item.file !== 'undefined'), // TODO: it needs to be defined to support localfile as `eventchannel`. These doesn't have file property.
              'localfile-commands': currentConfig[
                'logcollector-localfile'
              ].localfile.filter(item => typeof item.file === 'undefined')
            }
          }
        : currentConfig;
    return (
      <Fragment>
        <WzTabSelector>
          <WzTabSelectorTab label="Logs">
            <WzConfigurationLogCollectionLogs
              currentConfig={currentConfig}
              agent={agent}
            />
          </WzTabSelectorTab>
          <WzTabSelectorTab label="Commands">
            <WzConfigurationLogCollectionCommands
              currentConfig={currentConfig}
              agent={agent}
            />
          </WzTabSelectorTab>
          <WzTabSelectorTab label="Sockets">
            <WzConfigurationLogCollectionSockets
              currentConfig={currentConfig}
              agent={agent}
            />
          </WzTabSelectorTab>
        </WzTabSelector>
      </Fragment>
    );
  }
}

const sections = [
  { component: 'logcollector', configuration: 'localfile' },
  { component: 'logcollector', configuration: 'socket' }
];

WzConfigurationLogCollection.propTypes = {
  // currentConfig: PropTypes.object.isRequired
};

export default withWzConfig(sections)(WzConfigurationLogCollection);
