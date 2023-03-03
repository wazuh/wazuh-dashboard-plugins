/*
 * Wazuh app - React component for show configuration of client-buffer.
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

import { EuiBasicTable } from '@elastic/eui';

import WzNoConfig from '../util-components/no-config';
import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';
import WzConfigurationSettingsHeader from '../util-components/configuration-settings-header';
import WzConfigurationSettingsGroup from '../util-components/configuration-settings-group';

import { i18n } from '@kbn/i18n';

import {
  isString,
  renderValueOrDefault,
  renderValueOrNoValue,
} from '../utils/utils';
import withWzConfig from '../util-hocs/wz-config';
import { webDocumentationLink } from '../../../../../../../common/services/web_documentation';

const helpLinks = [
  {
    text: i18n.translate(
      'wazuh.public.controller.management.config.cilent.check',
      {
        defaultMessage: 'Checking connection with manager',
      },
    ),
    href: webDocumentationLink('user-manual/agents/agent-connection.html'),
  },
  {
    text: i18n.translate(
      'wazuh.public.controller.management.config.cilent.ref',
      {
        defaultMessage: 'Client reference',
      },
    ),
    href: webDocumentationLink('user-manual/reference/ossec-conf/client.html'),
  },
];

const mainSettings = [
  {
    field: 'crypto_method',
    label: i18n.translate(
      'wazuh.public.controller.management.config.cilent.encrypt',
      {
        defaultMessage: 'Method used to encrypt communications',
      },
    ),
  },
  {
    field: 'remote_conf',
    label: i18n.translate(
      'wazuh.public.controller.management.config.cilent.remote',
      {
        defaultMessage: 'Remote configuration is enabled',
      },
    ),
  },
  {
    field: 'auto_restart',
    label: i18n.translate(
      'wazuh.public.controller.management.config.cilent.maneger',
      {
        defaultMessage:
          'Auto-restart the agent when receiving valid configuration from manager',
      },
    ),
  },
  {
    field: 'notify_time',
    label: i18n.translate(
      'wazuh.public.controller.management.config.cilent.time',
      {
        defaultMessage:
          'Time (in seconds) between agent checkings to the manager',
      },
    ),
  },
  {
    field: 'time-reconnect',
    label: i18n.translate(
      'wazuh.public.controller.management.config.cilent.reconnect',
      {
        defaultMessage: 'Time (in seconds) before attempting to reconnect',
      },
    ),
  },
  {
    field: 'config-profile',
    label: i18n.translate(
      'wazuh.public.controller.management.config.cilent.ConfigurationProfiles',
      {
        defaultMessage: 'Configuration profiles',
      },
    ),
  },
  {
    field: 'local_ip',
    label: i18n.translate(
      'wazuh.public.controller.management.config.cilent.network',
      {
        defaultMessage:
          'IP address used when the agent has multiple network interfaces',
      },
    ),
  },
];

const columns = [
  {
    field: 'address',
    name: i18n.translate(
      'wazuh.public.controller.management.config.cilent.Address',
      {
        defaultMessage: 'Address',
      },
    ),
    render: renderValueOrNoValue,
  },
  {
    field: 'port',
    name: i18n.translate(
      'wazuh.public.controller.management.config.cilent.Port',
      {
        defaultMessage: 'Port',
      },
    ),
    render: renderValueOrDefault('1514'),
  },
  {
    field: 'protocol',
    name: i18n.translate(
      'wazuh.public.controller.management.config.cilent.Protocol',
      {
        defaultMessage: 'Protocol',
      },
    ),
    render: renderValueOrDefault('udp'),
  },
  {
    field: 'max_retries',
    name: i18n.translate(
      'wazuh.public.controller.management.config.cilent.maxConnect',
      {
        defaultMessage: 'Maximum retries to connect',
      },
    ),
    render: renderValueOrNoValue,
  },
  {
    field: 'retry_interval',
    name: i18n.translate(
      'wazuh.public.controller.management.config.cilent.retry',
      {
        defaultMessage: 'Retry interval to connect',
      },
    ),
    render: renderValueOrNoValue,
  },
];

class WzConfigurationClient extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { currentConfig } = this.props;
    return (
      <Fragment>
        {currentConfig['agent-client'] &&
          isString(currentConfig['agent-client']) && (
            <WzNoConfig
              error={currentConfig['agent-client']}
              help={helpLinks}
            />
          )}
        {currentConfig['agent-client'] &&
          !isString(currentConfig['agent-client']) && (
            <WzConfigurationSettingsTabSelector
              title={i18n.translate(
                'wazuh.public.controller.management.config.cilent.mainSetting',
                {
                  defaultMessage: 'Main settings',
                },
              )}
              description={i18n.translate(
                'wazuh.public.controller.management.config.cilent.comminication',
                {
                  defaultMessage: 'Basic manager-agent communication settings',
                },
              )}
              currentConfig={currentConfig}
              minusHeight={355}
              helpLinks={helpLinks}
            >
              <WzConfigurationSettingsGroup
                config={currentConfig['agent-client'].client}
                items={mainSettings}
              />
              {currentConfig['agent-client'].client.server.length && (
                <Fragment>
                  <WzConfigurationSettingsHeader
                    title={i18n.translate(
                      'wazuh.public.controller.management.config.cilent.server',
                      {
                        defaultMessage: 'Server settings',
                      },
                    )}
                    description={i18n.translate(
                      'wazuh.public.controller.management.config.cilent.connect',
                      {
                        defaultMessage: 'List of managers to connect',
                      },
                    )}
                  />
                  <EuiBasicTable
                    items={currentConfig['agent-client'].client.server}
                    columns={columns}
                  />
                </Fragment>
              )}
            </WzConfigurationSettingsTabSelector>
          )}
      </Fragment>
    );
  }
}

const sections = [{ component: 'agent', configuration: 'client' }];

WzConfigurationClient.propTypes = {
  // currentConfig: PropTypes.object.isRequired
};

export default withWzConfig(sections)(WzConfigurationClient);
