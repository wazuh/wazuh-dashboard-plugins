/*
 * Wazuh app - React component for show configuration of global configuration - remote tab.
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

import { EuiSpacer } from '@elastic/eui';

import WzConfigurationSettingsGroup from '../util-components/configuration-settings-group';
import WzConfigurationSettingsHeader from '../util-components/configuration-settings-header';
import WzNoConfig from '../util-components/no-config';
import { hasSize, isString, renderValueOrNoValue } from '../utils/utils';
import { webDocumentationLink } from '../../../../../../../common/services/web_documentation';

const httpsSettings = [
  { field: 'https.port', label: 'Port', render: renderValueOrNoValue },
  {
    field: 'https.bind_addr',
    label: 'Bind address',
    render: renderValueOrNoValue,
  },
  {
    field: 'https.certificate',
    label: 'Certificate',
    render: renderValueOrNoValue,
  },
  { field: 'https.key', label: 'Key', render: renderValueOrNoValue },
];

const legacySettings = [
  { field: 'legacy.enabled', label: 'Enabled', render: renderValueOrNoValue },
  { field: 'legacy.port', label: 'Port', render: renderValueOrNoValue },
  { field: 'legacy.protocol', label: 'Protocol', render: renderValueOrNoValue },
  { field: 'legacy.ipv6', label: 'IPv6', render: renderValueOrNoValue },
  {
    field: 'legacy.local_ip',
    label: 'Local IP address',
    render: renderValueOrNoValue,
  },
  {
    field: 'legacy.queue_size',
    label: 'Queue size',
    render: renderValueOrNoValue,
  },
  {
    field: 'legacy.rids_closing_time',
    label: 'RIDs closing time',
    render: renderValueOrNoValue,
  },
  {
    field: 'legacy.connection_overtake_time',
    label: 'Connection overtake time',
    render: renderValueOrNoValue,
  },
];

const agentsSettings = [
  {
    field: 'agents.allow_higher_versions',
    label: 'Allow higher versions',
    render: renderValueOrNoValue,
  },
];

const helpLinks = [
  {
    text: 'Remote daemon reference',
    href: webDocumentationLink(
      'user-manual/reference/daemons/wazuh-remoted.html',
    ),
  },
  {
    text: 'Remote configuration reference',
    href: webDocumentationLink('user-manual/reference/ossec-conf/remote.html'),
  },
];

class WzConfigurationGlobalConfigurationRemote extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { currentConfig } = this.props;
    const remoteConfig = currentConfig['request-remote'];
    const remoteSettings = Array.isArray(remoteConfig?.remote)
      ? remoteConfig.remote[0]
      : undefined;
    const hasHTTPSSettings = Boolean(hasSize(remoteSettings?.https));
    const hasLegacySettings = Boolean(hasSize(remoteSettings?.legacy));
    const hasAgentsSettings = Boolean(hasSize(remoteSettings?.agents));
    return (
      <Fragment>
        {currentConfig['request-remote'] &&
          isString(currentConfig['request-remote']) && (
            <WzNoConfig
              error={currentConfig['request-remote']}
              help={helpLinks}
            />
          )}
        {currentConfig['request-remote'] &&
          !isString(currentConfig['request-remote']) &&
          !currentConfig['request-remote'].remote && (
            <WzNoConfig error='not-present' help={helpLinks} />
          )}
        {currentConfig['request-remote'] &&
          currentConfig['request-remote'].remote && (
            <WzConfigurationSettingsHeader
              title='Remote settings'
              description='Configuration to listen for events from the agents or a syslog client'
              help={helpLinks}
            >
              {hasHTTPSSettings && (
                <Fragment>
                  <WzConfigurationSettingsGroup
                    title='HTTPS settings'
                    description='Listener the agents use to communicate with the manager over HTTPS'
                    config={remoteSettings}
                    items={httpsSettings}
                  />
                  <EuiSpacer size='m' />
                </Fragment>
              )}
              {hasLegacySettings && (
                <Fragment>
                  <WzConfigurationSettingsGroup
                    title='Legacy settings'
                    description='Listener kept for agents that still communicate over the legacy protocol'
                    config={remoteSettings}
                    items={legacySettings}
                  />
                  <EuiSpacer size='m' />
                </Fragment>
              )}
              {hasAgentsSettings && (
                <Fragment>
                  <WzConfigurationSettingsGroup
                    title='Agents settings'
                    description='Settings applied to the agents that connect to this manager'
                    config={remoteSettings}
                    items={agentsSettings}
                  />
                </Fragment>
              )}
            </WzConfigurationSettingsHeader>
          )}
      </Fragment>
    );
  }
}

export default WzConfigurationGlobalConfigurationRemote;
