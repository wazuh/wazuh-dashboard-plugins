/*
 * Wazuh app - React component for show configuration of log collection - logs tab.
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
import WzConfigurationSettingsHeader from '../util-components/configuration-settings-header';
import WzConfigurationListSelector from '../util-components/configuration-settings-list-selector';
import { isString, renderValueOrNoValue } from '../utils/utils';
import { settingsListBuilder } from '../utils/builders';

import helpLinks from './help-links';
import { LOGCOLLECTOR_LOCALFILE_PROP, LOCALFILE_LOGS_PROP } from './types';

const renderTargetField = item => (item ? item.join(', ') : 'agent');
const renderArrayObjectField = arrayObjectField => {
  const stringToRender = arrayObjectField
    ? arrayObjectField
        .map(({ value, type }) => value?.concat(type ? ` (${type})` : ''))
        .join(', ')
    : '-';
  return stringToRender;
};

const mainSettings = [
  { field: 'logformat', label: 'Log format' },
  { field: 'file', label: 'Log location', render: renderValueOrNoValue },
  {
    field: 'only-future-events',
    label: 'Only receive logs occured after start',
    when: 'agent',
  },
  {
    field: 'reconnect_time',
    label:
      'Time in seconds to try to reconnect with Windows Event Channel when it has fallen',
    when: 'agent',
  },
  {
    field: 'query',
    label: 'Filter logs using this XPATH query',
    render: renderValueOrNoValue,
    when: 'agent',
  },
  {
    field: 'labels',
    label: 'Only receive logs occured after start',
    render: renderValueOrNoValue,
    when: 'agent',
  },
  {
    field: 'target',
    label: 'Redirect output to this socket',
    render: renderTargetField,
  },
  {
    field: 'ignore',
    label: 'If the expression matches, the log will be ignored',
    render: renderArrayObjectField,
  },
  {
    field: 'restrict',
    label: 'The log will only be processed if the expression matches',
    render: renderArrayObjectField,
  },
];

const getMainSettingsAgentOrManager = agent =>
  agent && agent.id === '000'
    ? mainSettings.filter(setting => setting.when !== 'agent')
    : mainSettings.filter(setting =>
        setting.when === 'agent'
          ? agent && agent.os && agent.os.platform === 'windows'
          : true,
      );
class WzConfigurationLogCollectionLogs extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { currentConfig, agent } = this.props;
    const items = currentConfig?.[LOGCOLLECTOR_LOCALFILE_PROP]?.[
      LOCALFILE_LOGS_PROP
    ]
      ? settingsListBuilder(
          currentConfig[LOGCOLLECTOR_LOCALFILE_PROP][LOCALFILE_LOGS_PROP],
          [
            'file',
            'alias',
            'commnad',
            item =>
              `${item.logformat}${
                item.target ? ` - ${item.target.join(', ')}` : ''
              }`,
          ],
        )
      : [];
    return (
      <Fragment>
        {isString(currentConfig?.[LOGCOLLECTOR_LOCALFILE_PROP]) && (
          <WzNoConfig
            error={currentConfig[LOGCOLLECTOR_LOCALFILE_PROP]}
            help={helpLinks}
          />
        )}
        {!isString(currentConfig?.[LOGCOLLECTOR_LOCALFILE_PROP]) &&
        !currentConfig?.[LOGCOLLECTOR_LOCALFILE_PROP]?.[LOCALFILE_LOGS_PROP]
          ?.length ? (
          <WzNoConfig error='not-present' help={helpLinks} />
        ) : null}
        {!isString(currentConfig?.[LOGCOLLECTOR_LOCALFILE_PROP]) &&
        currentConfig?.[LOGCOLLECTOR_LOCALFILE_PROP]?.[LOCALFILE_LOGS_PROP]
          ?.length ? (
          <WzConfigurationSettingsHeader
            title='Logs files'
            description='List of log files that will be analyzed'
            help={helpLinks}
          >
            <WzConfigurationListSelector
              items={items}
              settings={getMainSettingsAgentOrManager(agent)}
            />
          </WzConfigurationSettingsHeader>
        ) : null}
      </Fragment>
    );
  }
}

export default WzConfigurationLogCollectionLogs;
