/*
 * Wazuh app - React component for show configuration of Azure logs.
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

import WzConfigurationSettingsTabSelector from '../util-components/configuration-settings-tab-selector';
import WzConfigurationSettingsGroup from '../util-components/configuration-settings-group';
import WzNoConfig from '../util-components/no-config';
import withWzConfig from '../util-hocs/wz-config';
import { isString, renderValueNoThenEnabled } from '../utils/utils';
import { wodleBuilder } from '../utils/builders';
import { webDocumentationLink } from '../../../../../../../common/services/web_documentation';
import { i18n } from '@kbn/i18n';

const text1 = i18n.translate(
  'wazuh.controller.manage.comp.confi.Using.Wazuh.Azure.text1',
  {
    defaultMessage: 'Using Wazuh to monitor Azure',
  },
);
const text2 = i18n.translate(
  'wazuh.controller.manage.comp.confi.Azurereference.text2',
  {
    defaultMessage: 'Azure reference',
  },
);
const helpLinks = [
  {
    text: text1,
    href: webDocumentationLink('azure/index.html'),
  },
  {
    text: text2,
    href: webDocumentationLink(
      'user-manual/reference/ossec-conf/wodle-azure-logs.html',
    ),
  },
];

const mainSettings = [
  {
    field: 'disabled',
    label: i18n.translate(
      'wazuh.public.controller.management.config.azure.logs.Enabled',
      {
        defaultMessage: 'Enabled',
      },
    ),
    render: renderValueNoThenEnabled,
  },
  {
    field: 'timeout',
    label: i18n.translate(
      'wazuh.public.controller.management.config.azure.logs.timeout',
      {
        defaultMessage: 'Timeout for each evaluation',
      },
    ),
  },
  {
    field: 'day',
    label: i18n.translate(
      'wazuh.public.controller.management.config.azure.logs.wday',
      {
        defaultMessage: 'Day of the month to run the Azure-Logs',
      },
    ),
  },
  {
    field: 'wday',
    label: i18n.translate(
      'wazuh.public.controller.management.config.azure.logs.month',
      {
        defaultMessage: 'Day of the month to run the Azure-Logs',
      },
    ),
  },
  {
    field: 'time',
    label: i18n.translate(
      'wazuh.public.controller.management.config.azure.logs.day',
      {
        defaultMessage: 'Time of the day to run the Azure-Logs',
      },
    ),
  },
  {
    field: 'interval',
    label: i18n.translate(
      'wazuh.public.controller.management.config.azure.logs.execution',
      {
        defaultMessage: 'Interval between Azure-Logs executions',
      },
    ),
  },
  {
    field: 'run_on_start',
    label: i18n.translate(
      'wazuh.public.controller.management.config.azure.logs.service',
      {
        defaultMessage: 'Run evaluation immediately when service is started',
      },
    ),
  },
];

const contentSettings = [
  {
    field: 'application_id',
    label: i18n.translate(
      'wazuh.public.controller.management.config.azure.logs.applicationId',
      {
        defaultMessage: 'Application id',
      },
    ),
  },
  {
    field: 'tag',
    label: i18n.translate(
      'wazuh.public.controller.management.config.azure.logs.Tag',
      {
        defaultMessage: 'Tag',
      },
    ),
  },
  {
    field: 'tenantdomain',
    label: i18n.translate(
      'wazuh.public.controller.management.config.azure.logs.Tenantdomain',
      {
        defaultMessage: 'Tenant domain',
      },
    ),
  },
  {
    field: 'application_key',
    label: i18n.translate(
      'wazuh.public.controller.management.config.azure.logs.Applicationkey',
      {
        defaultMessage: 'Application key',
      },
    ),
  },
  {
    field: 'account_name',
    label: i18n.translate(
      'wazuh.public.controller.management.config.azure.logs.Accountname',
      {
        defaultMessage: 'Account name',
      },
    ),
  },
  {
    field: 'account_key',
    label: i18n.translate(
      'wazuh.public.controller.management.config.azure.logs.Accountkey',
      {
        defaultMessage: 'Account key',
      },
    ),
  },
  {
    field: 'auth_path',
    label: i18n.translate(
      'wazuh.public.controller.management.config.azure.logs.identifier',
      {
        defaultMessage:
          'Path of the file that contains the application identifier and the application key',
      },
    ),
  },
];

class WzConfigurationAzure extends Component {
  constructor(props) {
    super(props);
    this.wodleConfig = wodleBuilder(this.props.currentConfig, 'azure-logs');
  }
  componentDidMount() {
    this.props.updateBadge(this.badgeEnabled());
  }
  badgeEnabled() {
    return (
      this.wodleConfig &&
      this.wodleConfig['azure-logs'] &&
      this.wodleConfig['azure-logs'].disabled === 'no'
    );
  }
  render() {
    const { currentConfig } = this.props;
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
          !this.wodleConfig['azure-logs'] &&
          !isString(currentConfig['wmodules-wmodules']) && (
            <WzNoConfig error='not-present' help={helpLinks} />
          )}
        {currentConfig && this.wodleConfig['azure-logs'] && (
          <WzConfigurationSettingsTabSelector
            title={i18n.translate(
              'wazuh.public.controller.management.config.azure.logs.mainSetting',
              {
                defaultMessage: 'Main settings',
              },
            )}
            description={i18n.translate(
              'wazuh.public.controller.management.config.azure.logs.wodle',
              {
                defaultMessage: 'Configuration for the Azure logs wodle',
              },
            )}
            currentConfig={this.wodleConfig}
            minusHeight={260}
            helpLinks={helpLinks}
          >
            <WzConfigurationSettingsGroup
              config={this.wodleConfig['azure-logs']}
              items={mainSettings}
            />
            {this.wodleConfig['azure-logs'].content &&
            this.wodleConfig['azure-logs'].content.length ? (
              <Fragment>
                {this.wodleConfig['azure-logs'].content.map(
                  (currentContent, key) => (
                    <Fragment key={`azure-logs-content-${key}`}>
                      {(currentContent.type || currentContent.tag) && (
                        <WzConfigurationSettingsGroup
                          title={currentContent.type || currentContent.tag}
                          config={currentContent}
                          items={contentSettings}
                        />
                      )}
                    </Fragment>
                  ),
                )}
              </Fragment>
            ) : null}
          </WzConfigurationSettingsTabSelector>
        )}
      </Fragment>
    );
  }
}

const sections = [{ component: 'wmodules', configuration: 'wmodules' }];

export default withWzConfig(sections)(WzConfigurationAzure);
