/*
 * Wazuh app - React component for show the agent communication configuration.
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

import { EuiBasicTable, EuiCallOut, EuiSpacer } from '@elastic/eui';

import WzNoConfig from '../util-components/no-config';
import WzConfigurationSettingsHeader from '../util-components/configuration-settings-header';
import WzConfigurationSettingsGroup from '../util-components/configuration-settings-group';
import {
  isString,
  renderValueOrDefault,
  renderValueOrNoValue,
} from '../utils/utils';
import withWzConfig from '../util-hocs/wz-config';
import { webDocumentationLink } from '../../../../../../../common/services/web_documentation';

const helpLinks = [
  {
    text: 'Checking connection with manager',
    href: webDocumentationLink(
      'user-manual/agent/agent-management/agent-connection.html#checking-connection-with-the-wazuh-manager',
    ),
  },
  {
    text: 'Client reference',
    href: webDocumentationLink(
      'user-manual/agent/agent-enrollment/enrollment-methods/via-agent-configuration/index.html',
    ),
  },
];

const mainSettings = [
  { field: 'remote_conf', label: 'Remote configuration is enabled' },
  {
    field: 'auto_restart',
    label:
      'Auto-restart the agent when receiving valid configuration from manager',
  },
  {
    field: 'notify_time',
    label: 'Time (in seconds) between agent checkings to the manager',
  },
  {
    field: 'time-reconnect',
    label: 'Time (in seconds) before attempting to reconnect',
  },
  { field: 'config-profile', label: 'Configuration profiles' },
];

/* Replaces the former client buffer settings: the anti-flooding buffer was
removed from the HTTPS agent and the accumulator it batches events with is
configured here instead. */
const batchSettings = [
  {
    field: 'size',
    label: 'Maximum size of a batch',
    render: renderValueOrNoValue,
  },
  {
    field: 'interval',
    label: 'Maximum time to wait before sending a batch',
    render: renderValueOrNoValue,
  },
];

/* `max_retries` and `retry_interval` are deliberately not shown: the agent
still reports them, but always with their default values. The HTTPS transport
removed server rotation and the connection-retry loop, so the parser ignores
whatever the user configures. Showing them would present a setting that has no
effect as if it were live. */
const columns = [
  { field: 'address', name: 'Address', render: renderValueOrNoValue },
  { field: 'port', name: 'Port', render: renderValueOrDefault('1514') },
];

/* The manager block holds either a single manager or a list of them, depending
on how the agent is configured. */
const asArray = value => (Array.isArray(value) ? value : value ? [value] : []);

class WzConfigurationClient extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { currentConfig } = this.props;
    const clientConfig = currentConfig?.agent?.agent;
    const managers = asArray(clientConfig?.manager);

    if (isString(clientConfig)) {
      return <WzNoConfig error={clientConfig} help={helpLinks} />;
    }

    if (!clientConfig) {
      return <WzNoConfig error='not-present' help={helpLinks} />;
    }

    return (
      <Fragment>
        <WzConfigurationSettingsHeader
          title='Main settings'
          description='Basic manager-agent communication settings'
          help={helpLinks}
        >
          <WzConfigurationSettingsGroup
            config={clientConfig}
            items={mainSettings}
          />
          <WzConfigurationSettingsHeader
            title='Server settings'
            description='List of managers to connect'
          />
          {managers.length ? (
            <EuiBasicTable
              items={managers}
              columns={columns}
              tableLayout='auto'
            />
          ) : (
            <EuiCallOut
              title='Client manager configuration error'
              color='warning'
              iconType='alert'
            >
              <p>The manager configuration is undefined or empty.</p>
            </EuiCallOut>
          )}
          {clientConfig.batch && (
            <Fragment>
              <EuiSpacer size='m' />
              <WzConfigurationSettingsHeader
                title='Batch settings'
                description='These settings determine how the agent batches the events it sends'
              />
              <WzConfigurationSettingsGroup
                config={clientConfig.batch}
                items={batchSettings}
              />
            </Fragment>
          )}
        </WzConfigurationSettingsHeader>
      </Fragment>
    );
  }
}

WzConfigurationClient.propTypes = {
  currentConfig: PropTypes.object,
};

export default withWzConfig()(WzConfigurationClient);
