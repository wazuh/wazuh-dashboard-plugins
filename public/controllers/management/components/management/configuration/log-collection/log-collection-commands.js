/*
 * Wazuh app - React component for show configuration of log collection - commands tab.
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

import WzNoConfig from '../util-components/no-config';
import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';
import WzConfigurationListSelector from '../util-components/configuration-settings-list-selector';
import { isString, renderValueOrDefault, renderValueOrNoValue } from '../utils/utils';
import { settingsListBuilder } from '../utils/builders';
import helpLinks from './help-links';
import { LOGCOLLECTOR_LOCALFILE_PROP, LOCALFILE_COMMANDS_PROP } from './types';

const renderTargetField = (item) => (item ? item.join(', ') : 'agent');

const mainSettings = [
  { field: 'logformat', label: 'Log format' },
  { field: 'command', label: 'Run this command', render: renderValueOrNoValue },
  { field: 'alias', label: 'Command alias', render: renderValueOrNoValue },
  {
    field: 'frequency',
    label: 'Interval between command executions',
    render: renderValueOrNoValue,
  },
  {
    field: 'target',
    label: 'Redirect output to this socket',
    render: renderTargetField,
  },
];

class WzConfigurationLogCollectionCommands extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { currentConfig } = this.props;
    const items = currentConfig?.[LOGCOLLECTOR_LOCALFILE_PROP]?.[LOCALFILE_COMMANDS_PROP]
      ? settingsListBuilder(currentConfig[LOGCOLLECTOR_LOCALFILE_PROP][LOCALFILE_COMMANDS_PROP], [
          'file',
          'alias',
          'commnad',
          (item) => `${item.logformat}${item.target ? ` - ${item.target.join(', ')}` : ''}`,
        ])
      : [];
    return (
      <Fragment>
        {isString(currentConfig?.[LOGCOLLECTOR_LOCALFILE_PROP]) && (
          <WzNoConfig error={currentConfig[LOGCOLLECTOR_LOCALFILE_PROP]} help={helpLinks} />
        )}
        {!isString(currentConfig?.[LOGCOLLECTOR_LOCALFILE_PROP]) &&
        !currentConfig?.[LOGCOLLECTOR_LOCALFILE_PROP]?.[LOCALFILE_COMMANDS_PROP]?.length ? (
          <WzNoConfig error="not-present" help={helpLinks} />
        ) : null}
        {!isString(currentConfig?.[LOGCOLLECTOR_LOCALFILE_PROP]) &&
        currentConfig?.[LOGCOLLECTOR_LOCALFILE_PROP]?.[LOCALFILE_COMMANDS_PROP]?.length ? (
          <WzConfigurationSettingsTabSelector
            title="Command monitoring"
            description="All output from these commands will be read as one or more log messages depending on whether command or full_command is used."
            currentConfig={currentConfig}
            minusHeight={this.props.agent.id === '000' ? 320 : 415}
            helpLinks={helpLinks}
          >
            <WzConfigurationListSelector items={items} settings={mainSettings} />
          </WzConfigurationSettingsTabSelector>
        ) : null}
      </Fragment>
    );
  }
}

export default WzConfigurationLogCollectionCommands;
