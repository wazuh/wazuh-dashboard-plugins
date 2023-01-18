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
import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';
import WzConfigurationListSelector from '../util-components/configuration-settings-list-selector';
import {
  isString,
  isArray,
  renderValueOrDefault,
  renderValueOrNoValue,
} from '../utils/utils';
import { settingsListBuilder } from '../utils/builders';
import { webDocumentationLink } from '../../../../../../../common/services/web_documentation';
import { i18n } from '@kbn/i18n';

const helpLinks = [
  {
    text: i18n.translate(
      'wazuh.public.controller.management.config.log.collection.sockets.multiplue',
      {
        defaultMessage: 'Using multiple outputs',
      },
    ),
    href: webDocumentationLink(
      'user-manual/capabilities/log-data-collection/log-data-configuration.html#using-multiple-outputs',
    ),
  },
  {
    text: i18n.translate(
      'wazuh.public.controller.management.config.log.collection.sockets.refence',
      {
        defaultMessage: 'Socketreference',
      },
    ),
    href: webDocumentationLink('user-manual/reference/ossec-conf/socket.html'),
  },
];

const mainSettings = [
  {
    field: 'name',
    label: i18n.translate(
      'wazuh.public.controller.management.config.log.collection.sockets.Socketname',
      {
        defaultMessage: 'Socket name',
      },
    ),
    render: renderValueOrNoValue,
  },
  {
    field: 'location',
    label: i18n.translate(
      'wazuh.public.controller.management.config.log.collection.sockets.Socketlocation',
      {
        defaultMessage: 'Socket location',
      },
    ),
    render: renderValueOrNoValue,
  },
  {
    field: 'mode',
    label: i18n.translate(
      'wazuh.public.controller.management.config.log.collection.sockets.unix',
      {
        defaultMessage: 'UNIX socket protocol',
      },
    ),
    render: renderValueOrDefault('udp'),
  },
  {
    field: 'prefix',
    label: i18n.translate(
      'wazuh.public.controller.management.config.log.collection.sockets.prefix',
      {
        defaultMessage: 'Prefix to place before the message',
      },
    ),
    render: renderValueOrNoValue,
  },
];

class WzConfigurationLogCollectionSockets extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { currentConfig } = this.props;
    const items = isArray(currentConfig['logcollector-socket'].target)
      ? settingsListBuilder(currentConfig['logcollector-socket'].target, 'name')
      : [];
    return (
      <Fragment>
        {currentConfig['logcollector-socket'] &&
          isString(currentConfig['logcollector-socket']) && (
            <WzNoConfig
              error={currentConfig['logcollector-socket']}
              help={helpLinks}
            />
          )}
        {currentConfig['logcollector-socket'] &&
        !isString(currentConfig['logcollector-socket']) &&
        !currentConfig['logcollector-socket'].target ? (
          <WzNoConfig error='not-present' help={helpLinks} />
        ) : null}
        {currentConfig['logcollector-socket'] &&
        !isString(currentConfig['logcollector-socket']) &&
        currentConfig['logcollector-socket'].target &&
        currentConfig['logcollector-socket'].target.length ? (
          <WzConfigurationSettingsTabSelector
            title={i18n.translate(
              'wazuh.public.controller.management.config.log.collection.sockets.socketOutput',
              {
                defaultMessage: 'Output sockets',
              },
            )}
            description={i18n.translate(
              'wazuh.public.controller.management.config.log.collection.sockets.define',
              {
                defaultMessage: 'Define custom outputs to send log data',
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

WzConfigurationLogCollectionSockets.propTypes = {
  // currentConfig: PropTypes.object.isRequired
};

export default WzConfigurationLogCollectionSockets;
