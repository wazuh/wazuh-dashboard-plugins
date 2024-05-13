/*
 * Wazuh app - React component for show configuration of log collection - sockets tab.
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
import {
  isString,
  isArray,
  renderValueOrDefault,
  renderValueOrNoValue,
} from '../utils/utils';
import { settingsListBuilder } from '../utils/builders';
import { LOGCOLLECTOR_SOCKET_PROP } from './types';
import { webDocumentationLink } from '../../../../../../../common/services/web_documentation';

const helpLinks = [
  {
    text: 'Using multiple outputs',
    href: webDocumentationLink(
      'user-manual/capabilities/log-data-collection/log-data-configuration.html#using-multiple-outputs',
    ),
  },
  {
    text: 'Socket reference',
    href: webDocumentationLink('user-manual/reference/ossec-conf/socket.html'),
  },
];

const mainSettings = [
  { field: 'name', label: 'Socket name', render: renderValueOrNoValue },
  { field: 'location', label: 'Socket location', render: renderValueOrNoValue },
  {
    field: 'mode',
    label: 'UNIX socket protocol',
    render: renderValueOrDefault('udp'),
  },
  {
    field: 'prefix',
    label: 'Prefix to place before the message',
    render: renderValueOrNoValue,
  },
];

class WzConfigurationLogCollectionSockets extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { currentConfig } = this.props;
    const items = isArray(currentConfig?.[LOGCOLLECTOR_SOCKET_PROP]?.target)
      ? settingsListBuilder(
          currentConfig[LOGCOLLECTOR_SOCKET_PROP].target,
          'name',
        )
      : isArray(currentConfig?.[LOGCOLLECTOR_SOCKET_PROP]?.socket)
      ? settingsListBuilder(
          currentConfig[LOGCOLLECTOR_SOCKET_PROP].socket,
          'name',
        )
      : [];
    return (
      <Fragment>
        {isString(currentConfig?.[LOGCOLLECTOR_SOCKET_PROP]) && (
          <WzNoConfig
            error={currentConfig[LOGCOLLECTOR_SOCKET_PROP]}
            help={helpLinks}
          />
        )}
        {!isString(currentConfig?.[LOGCOLLECTOR_SOCKET_PROP]) &&
        !items.length ? (
          <WzNoConfig error='not-present' help={helpLinks} />
        ) : null}
        {!isString(currentConfig?.[LOGCOLLECTOR_SOCKET_PROP]) &&
        items.length ? (
          <WzConfigurationSettingsHeader
            title='Output sockets'
            description='Define custom outputs to send log data'
            help={helpLinks}
          >
            <WzConfigurationListSelector
              items={items}
              settings={mainSettings}
            />
          </WzConfigurationSettingsHeader>
        ) : null}
      </Fragment>
    );
  }
}

export default WzConfigurationLogCollectionSockets;
