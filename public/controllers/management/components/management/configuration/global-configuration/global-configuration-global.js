/*
 * Wazuh app - React component for show configuration of global configuration - global tab.
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
import { i18n } from '@kbn/i18n';

import WzConfigurationSettingsGroup from '../util-components/configuration-settings-group';
import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';
import WzNoConfig from '../util-components/no-config';

import { isString } from '../utils/utils';
import { webDocumentationLink } from '../../../../../../../common/services/web_documentation';

const helpLinks = [
  {
    text: i18n.translate(
      'wazuh.public.controller.management.config.global.GlobalReference',
      {
        defaultMessage: 'Global reference',
      },
    ),
    href: webDocumentationLink('user-manual/reference/ossec-conf/global.html'),
  },
  {
    text: i18n.translate(
      'wazuh.public.controller.management.config.global.LoggingReference',
      {
        defaultMessage: 'Logging reference',
      },
    ),
    href: webDocumentationLink('user-manual/reference/ossec-conf/logging.html'),
  },
];

const mainSettings = [
  {
    field: 'alerts_log',
    label: i18n.translate(
      'wazuh.public.controller.management.config.global.fileAlert1',
      {
        defaultMessage: 'Write alerts to alerts.log file',
      },
    ),
  },
  {
    field: 'jsonout_output',
    label: i18n.translate(
      'wazuh.public.controller.management.config.global.fileJson',
      {
        defaultMessage: 'Write JSON formatted alerts to alerts.json file',
      },
    ),
  },
  {
    field: 'logall',
    label: i18n.translate(
      'wazuh.public.controller.management.config.global.plainFormat',
      {
        defaultMessage: 'Archive all the alerts in plain text format',
      },
    ),
  },
  {
    field: 'logall_json',
    label: i18n.translate(
      'wazuh.public.controller.management.config.global.alertJson',
      {
        defaultMessage: 'Archive all the alerts in JSON format',
      },
    ),
  },
  {
    field: 'custom_alert_output',
    label: i18n.translate(
      'wazuh.public.controller.management.config.global.customized',
      {
        defaultMessage: 'Customized alerts format for alerts.log file',
      },
    ),
  },
  {
    field: 'plain',
    label: i18n.translate(
      'wazuh.public.controller.management.config.global.write',
      {
        defaultMessage: 'Write internal logs in plain text',
      },
    ),
  },
  {
    field: 'json',
    label: i18n.translate(
      'wazuh.public.controller.management.config.global.json',
      {
        defaultMessage: 'Write internal logs in JSON format',
      },
    ),
  },
  {
    field: 'max_output_size',
    label: i18n.translate(
      'wazuh.public.controller.management.config.global.sizeLimit',
      {
        defaultMessage: 'Size limit of alert files',
      },
    ),
  },
  {
    field: 'rotate_interval',
    label: i18n.translate(
      'wazuh.public.controller.management.config.global.FileRotation',
      {
        defaultMessage: 'File rotation interval',
      },
    ),
  },
];

const emailSettings = [
  {
    field: 'email_notification',
    label: i18n.translate(
      'wazuh.public.controller.management.config.global.sentEmail',
      {
        defaultMessage: 'Enable alerts sent by email',
      },
    ),
  },
  {
    field: 'email_from',
    label: i18n.translate(
      'wazuh.public.controller.management.config.global.sender',
      {
        defaultMessage: 'Sender adress for email alerts',
      },
    ),
  },
  {
    field: 'email_to',
    label: i18n.translate(
      'wazuh.public.controller.management.config.global.recipient',
      {
        defaultMessage: 'Recipient address for email alerts',
      },
    ),
  },
  {
    field: 'email_reply_to',
    label: i18n.translate(
      'wazuh.public.controller.management.config.global.replytoo',
      {
        defaultMessage: 'Reply-to address for email alerts',
      },
    ),
  },
  {
    field: 'smtp_server',
    label: i18n.translate(
      'wazuh.public.controller.management.config.global.SMTP',
      {
        defaultMessage: 'Address for SMTP mail server',
      },
    ),
  },
  {
    field: 'email_maxperhour',
    label: i18n.translate(
      'wazuh.public.controller.management.config.global.alertSent',
      {
        defaultMessage: 'Maximum number of email alerts sent per hour',
      },
    ),
  },
  {
    field: 'email_log_source',
    label: i18n.translate(
      'wazuh.public.controller.management.config.global.dataFoam',
      {
        defaultMessage: 'File to read data from',
      },
    ),
  },
  {
    field: 'email_idsname',
    label: i18n.translate(
      'wazuh.public.controller.management.config.global.header',
      {
        defaultMessage: 'Name used for email alerts headers',
      },
    ),
  },
];

const otherSettings = [
  {
    field: 'stats',
    label: i18n.translate(
      'wazuh.public.controller.management.config.global.gernated',
      {
        defaultMessage:
          'Severity level for alerts generated by statistical analysis',
      },
    ),
  },
  {
    field: 'host_information',
    label: i18n.translate(
      'wazuh.public.controller.management.config.global.moniter',
      {
        defaultMessage:
          'Severity level for alerts generated by host change monitor',
      },
    ),
  },
  {
    field: 'memory_size',
    label: i18n.translate(
      'wazuh.public.controller.management.config.global.memory',
      {
        defaultMessage: 'Memory size for the alert correlation engine',
      },
    ),
  },
  {
    field: 'white_list',
    label: i18n.translate(
      'wazuh.public.controller.management.config.global.ipAddress',
      {
        defaultMessage: 'White-listed IP addresses',
      },
    ),
  },
  {
    field: 'geoip_db_path',
    label: i18n.translate(
      'wazuh.public.controller.management.config.global.datbase',
      {
        defaultMessage: 'Full path to MaxMind GeoIP IPv4 database file',
      },
    ),
  },
];

const preludeZeroMQOutputSettings = [
  {
    field: 'prelude_output',
    label: i18n.translate(
      'wazuh.public.controller.management.config.global.enable',
      {
        defaultMessage: 'Enable Prelude output',
      },
    ),
  },
  {
    field: 'zeromq_output',
    label: i18n.translate(
      'wazuh.public.controller.management.config.global.output',
      {
        defaultMessage: 'Enable ZeroMQ output',
      },
    ),
  },
  {
    field: 'zeromq_uri',
    label: i18n.translate(
      'wazuh.public.controller.management.config.global.socket',
      {
        defaultMessage: 'ZeroMQ URI to bind publisher socket',
      },
    ),
  },
];

const buildHelpLinks = agent =>
  agent.id === '000' ? helpLinks : [helpLinks[1]];

class WzConfigurationGlobalConfigurationGlobal extends Component {
  constructor(props) {
    super(props);
    this.helpLinks = buildHelpLinks(this.props.agent);
  }
  render() {
    const { currentConfig, agent, wazuhNotReadyYet } = this.props;
    const mainSettingsConfig =
      agent.id === '000' &&
      currentConfig['analysis-global'] &&
      currentConfig['analysis-global'].global &&
      currentConfig['com-logging'] &&
      currentConfig['com-logging'].logging
        ? {
            ...currentConfig['analysis-global'].global,
            plain: currentConfig['com-logging'].logging.plain,
            json: currentConfig['com-logging'].logging.json,
          }
        : currentConfig['com-logging'] && currentConfig['com-logging'].logging
        ? {
            plain: currentConfig['com-logging'].logging.plain,
            json: currentConfig['com-logging'].logging.json,
          }
        : {};
    const globalSettingsConfig =
      agent.id === '000' &&
      currentConfig['analysis-global'] &&
      currentConfig['analysis-global'].global
        ? {
            ...currentConfig['analysis-global'].global,
          }
        : {};
    return (
      <Fragment>
        {currentConfig['analysis-global'] &&
          isString(currentConfig['analysis-global']) && (
            <WzNoConfig
              error={currentConfig['analysis-global']}
              help={this.helpLinks}
            />
          )}
        {agent &&
          agent.id !== '000' &&
          currentConfig['com-logging'] &&
          isString(currentConfig['com-logging']) && (
            <WzNoConfig
              error={currentConfig['com-global']}
              help={this.helpLinks}
            />
          )}
        {currentConfig['analysis-global'] &&
          !isString(currentConfig['analysis-global']) &&
          !currentConfig['analysis-global'].global && (
            <WzNoConfig error='not-present' help={this.helpLinks} />
          )}
        {wazuhNotReadyYet &&
          (!currentConfig || !currentConfig['analysis-global']) && (
            <WzNoConfig error='Wazuh not ready yet' help={this.helpLinks} />
          )}
        {((currentConfig['analysis-global'] &&
          currentConfig['analysis-global'].global) ||
          (currentConfig['com-logging'] &&
            currentConfig['com-logging'].logging)) && (
          <WzConfigurationSettingsTabSelector
            title={i18n.translate(
              'wazuh.public.controller.management.config.global.Mainsettings',
              {
                defaultMessage: 'Main settings',
              },
            )}
            description={i18n.translate(
              'wazuh.public.controller.management.config.global.loggingSetting',
              {
                defaultMessage: 'Basic alerts and logging settings',
              },
            )}
            currentConfig={currentConfig}
            minusHeight={agent.id === '000' ? 320 : 355}
            helpLinks={this.helpLinks}
          >
            <WzConfigurationSettingsGroup
              config={mainSettingsConfig}
              items={mainSettings}
            />
            {agent.id === '000' && (
              <Fragment>
                <WzConfigurationSettingsGroup
                  title={i18n.translate(
                    'wazuh.public.controller.management.config.global.Emailsettings1',
                    {
                      defaultMessage: 'Email settings',
                    },
                  )}
                  description={i18n.translate(
                    'wazuh.public.controller.management.config.global.emailSetting',
                    {
                      defaultMessage:
                        'Basic email settings (needed for granular email settings',
                    },
                  )}
                  config={globalSettingsConfig}
                  items={emailSettings}
                />
                <WzConfigurationSettingsGroup
                  title={i18n.translate(
                    'wazuh.public.controller.management.config.global.Othersettings',
                    {
                      defaultMessage: 'Other settings',
                    },
                  )}
                  description={i18n.translate(
                    'wazuh.public.controller.management.config.global.setting',
                    {
                      defaultMessage:
                        'Settings not directly related to any specific component',
                    },
                  )}
                  config={globalSettingsConfig}
                  items={otherSettings}
                />
                <WzConfigurationSettingsGroup
                  title={i18n.translate(
                    'wazuh.public.controller.management.config.global.outputPrelude',
                    {
                      defaultMessage: 'Prelude and ZeroMQ output',
                    },
                  )}
                  config={globalSettingsConfig}
                  items={preludeZeroMQOutputSettings}
                />
              </Fragment>
            )}
          </WzConfigurationSettingsTabSelector>
        )}
      </Fragment>
    );
  }
}

WzConfigurationGlobalConfigurationGlobal.propTypes = {
  // currentConfig: PropTypes.object.isRequired,
  agent: PropTypes.object,
  wazuhNotReadyYet: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
};

export default WzConfigurationGlobalConfigurationGlobal;
