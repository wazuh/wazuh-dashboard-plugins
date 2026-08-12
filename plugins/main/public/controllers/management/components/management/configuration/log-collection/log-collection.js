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
import PropTypes from 'prop-types';

import WzTabSelector, {
  WzTabSelectorTab,
} from '../util-components/tab-selector';
import WzConfigurationLogCollectionLogs from './log-collection-logs';
import WzConfigurationLogCollectionCommands from './log-collection-commands';
import WzConfigurationLogCollectionWindowsEvents from './log-collection-windowsevents';
import WzConfigurationLogCollectionMacOSEvents from './log-collection-macosevents';
import WzConfigurationLogCollectionSockets from './log-collection-sockets';
import WzConfigurationLogCollectionJournald from './log-collection-journald';
import withWzConfig from '../util-hocs/wz-config';
import { isString } from '../utils/utils';
import {
  LOCALFILE_COMMANDS_PROP,
  LOCALFILE_LOGS_PROP,
  LOCALFILE_WINDOWSEVENT_PROP,
  LOGCOLLECTOR_PROP,
  LOCALFILE_MACOSEVENT_PROP,
  LOCALFILE_JOURNALDT_PROP,
} from './types';

class WzConfigurationLogCollection extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    let { currentConfig, agent } = this.props;
    const logcollector = currentConfig[LOGCOLLECTOR_PROP];
    /* An agent with a single localfile block reports it as an object instead
    of a list. */
    const localfiles = Array.isArray(logcollector?.localfile)
      ? logcollector.localfile
      : logcollector?.localfile
      ? [logcollector.localfile]
      : [];

    currentConfig =
      logcollector && !isString(logcollector)
        ? {
            ...currentConfig,
            [LOGCOLLECTOR_PROP]: {
              ...logcollector,
              [LOCALFILE_LOGS_PROP]: localfiles.filter(
                item => typeof item.file !== 'undefined',
              ), // TODO: it needs to be defined to support localfile as `eventchannel`. These doesn't have file property.
              [LOCALFILE_WINDOWSEVENT_PROP]: localfiles.filter(
                item =>
                  item.logformat === 'eventchannel' ||
                  item.logformat === 'eventlog',
              ),
              [LOCALFILE_MACOSEVENT_PROP]: localfiles.filter(
                item => item.logformat === 'macos',
              ),
              [LOCALFILE_JOURNALDT_PROP]: localfiles.filter(
                item => item.logformat === 'journald',
              ),
              [LOCALFILE_COMMANDS_PROP]: localfiles.filter(
                item =>
                  item.logformat === 'command' ||
                  item.logformat === 'full_command',
              ),
            },
          }
        : currentConfig;

    const tabsToRender = [
      {
        condition:
          currentConfig[LOGCOLLECTOR_PROP] &&
          currentConfig[LOGCOLLECTOR_PROP][LOCALFILE_LOGS_PROP]?.length > 0,
        component: (
          <WzTabSelectorTab label='Logs'>
            <WzConfigurationLogCollectionLogs
              currentConfig={currentConfig}
              agent={agent}
            />
          </WzTabSelectorTab>
        ),
      },
      {
        condition:
          currentConfig[LOGCOLLECTOR_PROP] &&
          currentConfig[LOGCOLLECTOR_PROP][LOCALFILE_WINDOWSEVENT_PROP]
            ?.length > 0,
        component: (
          <WzTabSelectorTab label='Windows Events'>
            <WzConfigurationLogCollectionWindowsEvents
              currentConfig={currentConfig}
              agent={agent}
            />
          </WzTabSelectorTab>
        ),
      },
      {
        condition:
          currentConfig[LOGCOLLECTOR_PROP] &&
          currentConfig[LOGCOLLECTOR_PROP][LOCALFILE_MACOSEVENT_PROP]?.length >
            0,
        component: (
          <WzTabSelectorTab label='macOS Events'>
            <WzConfigurationLogCollectionMacOSEvents
              currentConfig={currentConfig}
              agent={agent}
            />
          </WzTabSelectorTab>
        ),
      },
      {
        condition:
          currentConfig[LOGCOLLECTOR_PROP] &&
          currentConfig[LOGCOLLECTOR_PROP][LOCALFILE_JOURNALDT_PROP]?.length >
            0,
        component: (
          <WzTabSelectorTab label='Journald'>
            <WzConfigurationLogCollectionJournald
              currentConfig={currentConfig}
              agent={agent}
            />
          </WzTabSelectorTab>
        ),
      },
      {
        condition:
          currentConfig[LOGCOLLECTOR_PROP] &&
          currentConfig[LOGCOLLECTOR_PROP][LOCALFILE_COMMANDS_PROP]?.length > 0,
        component: (
          <WzTabSelectorTab label='Commands'>
            <WzConfigurationLogCollectionCommands
              currentConfig={currentConfig}
              agent={agent}
            />
          </WzTabSelectorTab>
        ),
      },
      {
        condition: true, // Will always render
        component: (
          <WzTabSelectorTab label='Sockets'>
            <WzConfigurationLogCollectionSockets
              currentConfig={currentConfig}
              agent={agent}
            />
          </WzTabSelectorTab>
        ),
      },
    ];

    return (
      <Fragment>
        <WzTabSelector>
          {tabsToRender
            .filter(tab => tab.condition)
            .map((tab, index) =>
              React.cloneElement(tab.component, {
                key: `WzTabSelectorTab_${index}`,
              }),
            )}
        </WzTabSelector>
      </Fragment>
    );
  }
}

WzConfigurationLogCollection.propTypes = {
  currentConfig: PropTypes.object,
};

export default withWzConfig()(WzConfigurationLogCollection);
