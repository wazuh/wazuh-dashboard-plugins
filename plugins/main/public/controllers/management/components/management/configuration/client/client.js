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

import { EuiCallOut, EuiSpacer } from '@elastic/eui';

import WzNoConfig from '../util-components/no-config';
import WzConfigurationSettingsHeader from '../util-components/configuration-settings-header';
import WzConfigurationSettingsGroup from '../util-components/configuration-settings-group';
import { isString, renderValueOrNoValue } from '../utils/utils';
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
    href: webDocumentationLink('user-manual/reference/ossec-conf/client.html'),
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
/* The agent reports one `endpoint` carrying the whole connection target -- host
and, when the agent was given them, port and path prefix -- so it is shown as
reported rather than split back into the parts the pre-5.0.0 `<address>`/
`<port>` table rendered. */
const serverSettings = [
  { field: 'endpoint', label: 'Endpoint', render: renderValueOrNoValue },
];

/* 5.0.0 allows a single `<manager>` block, so the reported value is read as one
manager whether it arrives as an object or wrapped in a one-element array. A
list is never rendered: multiple endpoints are an explicit non-goal of the
agent-side change. */
const readManager = value => (Array.isArray(value) ? value[0] : value);

class WzConfigurationClient extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { currentConfig } = this.props;
    const clientConfig = currentConfig?.agent?.agent;
    const manager = readManager(clientConfig?.manager);
    const endpoint = manager?.endpoint;

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
            description='Manager the agent connects to'
          />
          {endpoint ? (
            <WzConfigurationSettingsGroup
              config={{ endpoint }}
              items={serverSettings}
            />
          ) : /* A manager reported without an endpoint is not an absent
          configuration: it is one written in the pre-5.0.0 `<address>`/`<port>`
          form, which this view cannot render. Saying so points at the agent
          that has to be upgraded, instead of claiming nothing was configured. */
          manager ? (
            <EuiCallOut
              title='Unsupported manager configuration'
              color='warning'
              iconType='alert'
            >
              <p>
                The agent reported a manager configuration without an endpoint.
              </p>
            </EuiCallOut>
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
