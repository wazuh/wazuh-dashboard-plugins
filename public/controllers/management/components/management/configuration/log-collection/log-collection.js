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
import WzConfigurationLogCollectionWindowsEvents from './log-collection-windowsevents'
import WzConfigurationLogCollectionSockets from './log-collection-sockets';
import withWzConfig from '../util-hocs/wz-config';
import { isString } from '../utils/utils';
import { 
  LOCALFILE_COMMANDS_PROP, 
  LOCALFILE_LOGS_PROP, 
  LOCALFILE_WINDOWSEVENT_PROP, 
  LOGCOLLECTOR_LOCALFILE_PROP } from './types'

class WzConfigurationLogCollection extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    let { currentConfig, agent } = this.props;
    currentConfig =
      currentConfig[LOGCOLLECTOR_LOCALFILE_PROP] &&
      !isString(currentConfig[LOGCOLLECTOR_LOCALFILE_PROP])
        ? {
            ...currentConfig,
            [LOGCOLLECTOR_LOCALFILE_PROP]: {
              ...currentConfig[LOGCOLLECTOR_LOCALFILE_PROP],
              [LOCALFILE_LOGS_PROP]: currentConfig[LOGCOLLECTOR_LOCALFILE_PROP].localfile.filter(item => typeof item.file !== 'undefined'), // TODO: it needs to be defined to support localfile as `eventchannel`. These doesn't have file property.
              [LOCALFILE_WINDOWSEVENT_PROP]: currentConfig[LOGCOLLECTOR_LOCALFILE_PROP].localfile.filter(item => item.logformat === 'eventchannel' || item.logformat === 'eventlog'),
              [LOCALFILE_COMMANDS_PROP]: currentConfig[LOGCOLLECTOR_LOCALFILE_PROP].localfile.filter(item => item.logformat === 'command' || item.logformat === 'full_command')
            }
          }
        : currentConfig;
    return (
      <Fragment>
        <WzTabSelector>
          { currentConfig[LOGCOLLECTOR_LOCALFILE_PROP][LOCALFILE_LOGS_PROP].length > 0 && 
            <WzTabSelectorTab label="Logs">
              <WzConfigurationLogCollectionLogs
                currentConfig={currentConfig}
                agent={agent}
              />
            </WzTabSelectorTab>
          }
          { currentConfig[LOGCOLLECTOR_LOCALFILE_PROP][LOCALFILE_WINDOWSEVENT_PROP].length > 0 && 
            <WzTabSelectorTab label="Windows Events">
              <WzConfigurationLogCollectionWindowsEvents
                currentConfig={currentConfig}
                agent={agent}
              />
            </WzTabSelectorTab>
          }
          { currentConfig[LOGCOLLECTOR_LOCALFILE_PROP][LOCALFILE_COMMANDS_PROP].length > 0 && 
            <WzTabSelectorTab label="Commands">
              <WzConfigurationLogCollectionCommands
                currentConfig={currentConfig}
                agent={agent}
              />
            </WzTabSelectorTab>
          }
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
