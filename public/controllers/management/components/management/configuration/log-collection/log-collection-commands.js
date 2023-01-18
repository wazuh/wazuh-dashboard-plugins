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
import {
  isString,
  renderValueOrDefault,
  renderValueOrNoValue,
} from '../utils/utils';
import { settingsListBuilder } from '../utils/builders';
import helpLinks from './help-links';
import { i18n } from '@kbn/i18n';

const renderTargetField = item => (item ? item.join(', ') : 'agent');

const mainSettings = [
  {
    field: 'logformat',
    label: i18n.translate(
      'wazuh.public.controller.management.config.log.collection.LogFormat',
      {
        defaultMessage: 'Log format',
      },
    ),
  },
  {
    field: 'command',
    label: i18n.translate(
      'wazuh.public.controller.management.config.log.collection.runCommand',
      {
        defaultMessage: 'Run this command',
      },
    ),
    render: renderValueOrNoValue,
  },
  {
    field: 'alias',
    label: i18n.translate(
      'wazuh.public.controller.management.config.log.collection.CommandAlias',
      {
        defaultMessage: 'Command alias',
      },
    ),
    render: renderValueOrNoValue,
  },
  {
    field: 'frequency',
    label: i18n.translate(
      'wazuh.public.controller.management.config.log.collection.executions',
      {
        defaultMessage: 'Interval between command executions',
      },
    ),
    render: renderValueOrNoValue,
  },
  {
    field: 'target',
    label: i18n.translate(
      'wazuh.public.controller.management.config.log.collection.socket',
      {
        defaultMessage: 'Redirect output to this socket',
      },
    ),
    render: renderTargetField,
  },
];

class WzConfigurationLogCollectionCommands extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { currentConfig } = this.props;
    const items =
      currentConfig['logcollector-localfile'] &&
      currentConfig['logcollector-localfile']['localfile-commands']
        ? settingsListBuilder(
            currentConfig['logcollector-localfile']['localfile-commands'],
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
        {currentConfig['logcollector-localfile'] &&
          isString(currentConfig['logcollector-localfile']) && (
            <WzNoConfig
              error={currentConfig['logcollector-localfile']}
              help={helpLinks}
            />
          )}
        {currentConfig['logcollector-localfile'] &&
        !isString(currentConfig['logcollector-localfile']) &&
        !(currentConfig['logcollector-localfile']['localfile-commands'] || [])
          .length ? (
          <WzNoConfig error='not-present' help={helpLinks} />
        ) : null}
        {currentConfig['logcollector-localfile'] &&
        !isString(currentConfig['logcollector-localfile']) &&
        currentConfig['logcollector-localfile']['localfile-commands'] &&
        currentConfig['logcollector-localfile']['localfile-commands'].length ? (
          <WzConfigurationSettingsTabSelector
            title={i18n.translate(
              'wazuh.public.controller.management.config.log.collection.CommandMonitoring',
              {
                defaultMessage: 'Command monitoring',
              },
            )}
            description={i18n.translate(
              'wazuh.public.controller.management.config.log.collection.',
              {
                defaultMessage:
                  'All output from these commands will be read as one or more log messages depending on whether command or full_command is used.',
              },
            )}
            currentConfig={currentConfig}
            minusHeight={this.props.agent.id === '000' ? 320 : 415}
            helpLinks={helpLinks}
          >
            <WzConfigurationListSelector
              items={items}
              settings={mainSettings}
            />
          </WzConfigurationSettingsTabSelector>
        ) : null}
      </Fragment>
    );
  }
}

WzConfigurationLogCollectionCommands.propTypes = {
  // currentConfig: PropTypes.object.isRequired
};

export default WzConfigurationLogCollectionCommands;
