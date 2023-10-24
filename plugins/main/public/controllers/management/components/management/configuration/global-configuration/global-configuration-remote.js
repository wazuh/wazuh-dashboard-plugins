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

import { EuiBasicTable, EuiSpacer } from '@elastic/eui';

import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';
import WzNoConfig from '../util-components/no-config';
import {
  isString,
  renderValueOrNoValue,
  renderValueOrDefault,
} from '../utils/utils';
import { webDocumentationLink } from '../../../../../../../common/services/web_documentation';

const renderAllowedDeniedIPs = (items, label) => {
  if (items) {
    return (
      <ul>
        {items.map((item, key) => (
          <li key={`remote-${label}-${key}`}>{item}</li>
        ))}
      </ul>
    );
  } else {
    return '-';
  }
};

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
    this.columns = [
      { field: 'connection', name: 'Connection', render: renderValueOrNoValue },
      { field: 'port', name: 'Port', render: renderValueOrNoValue },
      {
        field: 'protocol',
        name: 'Protocol',
        render: renderValueOrDefault('udp'),
      },
      { field: 'ipv6', name: 'IPv6', render: renderValueOrNoValue },
      {
        field: 'allowed-ips',
        name: 'Allowed IP addresses',
        render: item => renderAllowedDeniedIPs(item, 'allowed'),
      },
      {
        field: 'denied-ips',
        name: 'Denied IP addresses',
        render: item => renderAllowedDeniedIPs(item, 'denied'),
      },
      {
        field: 'local_ip',
        name: 'Local IP address',
        render: renderValueOrDefault('All interfaces'),
      },
      {
        field: 'queue_size',
        name: 'Queue size',
        render: renderValueOrDefault('16384'),
      },
    ];
  }
  render() {
    const { currentConfig } = this.props;
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
            <WzConfigurationSettingsTabSelector
              title='Remote settings'
              description='Configuration to listen for events from the agents or a syslog client'
              minusHeight={320}
              currentConfig={currentConfig}
              helpLinks={helpLinks}
            >
              <EuiSpacer size='s' />
              <EuiBasicTable
                columns={this.columns}
                items={currentConfig['request-remote'].remote}
                tableLayout='auto'
              />
            </WzConfigurationSettingsTabSelector>
          )}
      </Fragment>
    );
  }
}

WzConfigurationGlobalConfigurationRemote.propTypes = {
  // currentConfig: PropTypes.object.isRequired
};

export default WzConfigurationGlobalConfigurationRemote;
