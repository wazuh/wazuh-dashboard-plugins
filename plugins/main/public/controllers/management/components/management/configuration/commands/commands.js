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
import PropTypes from 'prop-types';

import WzNoConfig from '../util-components/no-config';
import WzConfigurationSettingsHeader from '../util-components/configuration-settings-header';
import WzConfigurationSettingsListSelector from '../util-components/configuration-settings-list-selector';
import withWzConfig from '../util-hocs/wz-config';
import { isString, renderValueNoThenEnabled } from '../utils/utils';
import { settingsListBuilder } from '../utils/builders';
import { webDocumentationLink } from '../../../../../../../common/services/web_documentation';

const helpLinks = [
  {
    text: 'Command module reference',
    href: webDocumentationLink(
      'user-manual/reference/ossec-conf/wodle-command.html',
    ),
  },
];

const mainSettings = [
  { field: 'disabled', label: 'Command status', renderValueNoThenEnabled },
  { field: 'tag', label: 'Command name' },
  { field: 'command', label: 'Command to execute' },
  { field: 'interval', label: 'Interval between executions' },
  { field: 'run_on_start', label: 'Run on start' },
  { field: 'ignore_output', label: 'Ignore command output' },
  { field: 'timeout', label: 'Timeout (in seconds) to wait for execution' },
  { field: 'verify_md5', label: 'Verify MD5 sum' },
  { field: 'verify_sha1', label: 'Verify SHA1 sum' },
  { field: 'verify_sha256', label: 'Verify SHA256 sum' },
  { field: 'skip_verification', label: 'Ignore checksum verification' },
];

/**
 * Collect every defined command from either shape `currentConfig` can take:
 * the manager returns all the wodles inside a single `wmodules-wmodules`
 * section, while an agent reports its configuration keyed by module name, with
 * one entry per command or a single one when only one is defined.
 */
const getCommands = currentConfig => {
  if (!currentConfig) {
    return [];
  }

  const managerWodles = currentConfig['wmodules-wmodules'];

  if (managerWodles) {
    return isString(managerWodles)
      ? []
      : managerWodles.wmodules
          .filter(item => item['command'])
          .map(item => item.command);
  }

  const reportedCommands = currentConfig['command'];

  if (!reportedCommands || isString(reportedCommands)) {
    return [];
  }
  return Array.isArray(reportedCommands)
    ? reportedCommands
    : [reportedCommands];
};

class WzConfigurationCommands extends Component {
  constructor(props) {
    super(props);
    this.wodleConfig = getCommands(this.props.currentConfig);
  }
  render() {
    const { currentConfig } = this.props;
    const error =
      currentConfig &&
      [currentConfig['wmodules-wmodules'], currentConfig['command']].find(
        section => isString(section),
      );
    const items = this.wodleConfig.length
      ? settingsListBuilder(this.wodleConfig, ['tag', 'command'])
      : false;

    if (error) {
      return <WzNoConfig error={error} help={helpLinks} />;
    }

    if (!items) {
      return <WzNoConfig error='not-present' help={helpLinks} />;
    }

    return (
      <Fragment>
        <WzConfigurationSettingsHeader
          title='Command definitions'
          description='Find here all the currently defined commands'
          help={helpLinks}
        >
          <WzConfigurationSettingsListSelector
            items={items}
            settings={mainSettings}
          />
        </WzConfigurationSettingsHeader>
      </Fragment>
    );
  }
}

const sections = [{ component: 'wmodules', configuration: 'wmodules' }];

WzConfigurationCommands.propTypes = {
  currentConfig: PropTypes.object,
};

export default withWzConfig(sections)(WzConfigurationCommands);
