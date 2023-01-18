/*
 * Wazuh app - React component for show configuration of commands.
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
import WzConfigurationSettingsListSelector from '../util-components/configuration-settings-list-selector';
import withWzConfig from '../util-hocs/wz-config';
import { isString, renderValueNoThenEnabled } from '../utils/utils';
import { settingsListBuilder } from '../utils/builders';
import { webDocumentationLink } from '../../../../../../../common/services/web_documentation';
import { i18n } from '@kbn/i18n';
const title1 = i18n.translate(
  'wazuh.controller.manage.comp.confi.commands.title1',
  {
    defaultMessage: 'Command definitions',
  },
);
const descp1 = i18n.translate(
  'wazuh.controller.manage.comp.confi.commands.descp1',
  {
    defaultMessage: 'Find here all the currently defined commands',
  },
);
const helpLinks = [
  {
    text: 'Command module reference',
    href: webDocumentationLink(
      'user-manual/reference/ossec-conf/wodle-command.html',
    ),
  },
];

const mainSettings = [
  {
    field: 'disabled',
    label: i18n.translate(
      'wazuh.public.controller.management.config.cilent.command.status',
      {
        defaultMessage: 'Command status',
      },
    ),
    renderValueNoThenEnabled,
  },
  {
    field: 'tag',
    label: i18n.translate(
      'wazuh.public.controller.management.config.cilent.command.name',
      {
        defaultMessage: 'Command name',
      },
    ),
  },
  {
    field: 'command',
    label: i18n.translate(
      'wazuh.public.controller.management.config.cilent.command.execute',
      {
        defaultMessage: 'Command to execute',
      },
    ),
  },
  {
    field: 'interval',
    label: i18n.translate(
      'wazuh.public.controller.management.config.cilent.command.interval',
      {
        defaultMessage: 'Interval between executions',
      },
    ),
  },
  {
    field: 'run_on_start',
    label: i18n.translate(
      'wazuh.public.controller.management.config.cilent.command.run',
      {
        defaultMessage: 'Run on start',
      },
    ),
  },
  {
    field: 'ignore_output',
    label: i18n.translate(
      'wazuh.public.controller.management.config.cilent.command.output',
      {
        defaultMessage: 'Ignore command output',
      },
    ),
  },
  {
    field: 'timeout',
    label: i18n.translate(
      'wazuh.public.controller.management.config.cilent.command.timeout',
      {
        defaultMessage: 'Timeout (in seconds) to wait for execution',
      },
    ),
  },
  {
    field: 'verify_md5',
    label: i18n.translate(
      'wazuh.public.controller.management.config.cilent.command.MD5',
      {
        defaultMessage: 'Verify MD5 sum',
      },
    ),
  },
  {
    field: 'verify_sha1',
    label: i18n.translate(
      'wazuh.public.controller.management.config.cilent.command.SHA1',
      {
        defaultMessage: 'Verify SHA1 sum',
      },
    ),
  },
  {
    field: 'verify_sha256',
    label: i18n.translate(
      'wazuh.public.controller.management.config.cilent.command.SHA256',
      {
        defaultMessage: 'Verify SHA256 sum',
      },
    ),
  },
  {
    field: 'skip_verification',
    label: i18n.translate(
      'wazuh.public.controller.management.config.cilent.command.verification',
      {
        defaultMessage: 'Ignore checksum verification',
      },
    ),
  },
];

class WzConfigurationCommands extends Component {
  constructor(props) {
    super(props);
    this.wodleConfig =
      this.props.currentConfig &&
      !isString(this.props.currentConfig['wmodules-wmodules'])
        ? this.props.currentConfig['wmodules-wmodules'].wmodules.filter(
            item => item['command'],
          )
        : [];
  }
  render() {
    const { currentConfig } = this.props;
    const items =
      this.wodleConfig && this.wodleConfig.length
        ? settingsListBuilder(
            this.wodleConfig.map(item => item.command),
            ['tag', 'command'],
          )
        : false;
    return (
      <Fragment>
        {currentConfig['wmodules-wmodules'] &&
          isString(currentConfig['wmodules-wmodules']) && (
            <WzNoConfig
              error={currentConfig['wmodules-wmodules']}
              help={helpLinks}
            />
          )}
        {currentConfig &&
          !items &&
          !isString(currentConfig['wmodules-wmodules']) && (
            <WzNoConfig error='not-present' help={helpLinks} />
          )}
        {currentConfig &&
        items &&
        !isString(currentConfig['wmodules-wmodules']) ? (
          <WzConfigurationSettingsTabSelector
            title={title1}
            description={descp1}
            currentConfig={currentConfig}
            minusHeight={this.props.agent.id === '000' ? 260 : 355}
            helpLinks={helpLinks}
          >
            <WzConfigurationSettingsListSelector
              items={items}
              settings={mainSettings}
            />
          </WzConfigurationSettingsTabSelector>
        ) : null}
      </Fragment>
    );
  }
}

const sections = [{ component: 'wmodules', configuration: 'wmodules' }];

WzConfigurationCommands.propTypes = {
  // currentConfig: PropTypes.object.isRequired
};

export default withWzConfig(sections)(WzConfigurationCommands);
