/*
 * Wazuh app - GitHub Panel tab - Stats
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { i18n } from '@osd/i18n';
import React from 'react';
import { EuiDescriptionList, EuiText } from '@elastic/eui';
import { PanelModuleConfiguration } from '../../../../common/modules/panel';
import { renderValueYesThenEnabled } from '../../../../../controllers/management/components/management/configuration/utils/utils';
import { LogoGitHub } from '../../../../common/logos';
import {
  mapModuleContentToRenderProperties,
  toApiAuthEntries,
} from '../../../../common/modules/panel/components/module-configuration-mapping';

const settings = [
  {
    field: 'enabled',
    label: i18n.translate(
      'wazuh.github.moduleConfiguration.serviceStatusLabel',
      {
        defaultMessage: 'Service status',
      },
    ),
    render: renderValueYesThenEnabled,
  },
  {
    field: 'only_future_events',
    label: i18n.translate(
      'wazuh.github.moduleConfiguration.onlyFutureEventsLabel',
      {
        defaultMessage: 'Collect events generated since agent was started',
      },
    ),
  },
  {
    field: 'time_delay',
    label: i18n.translate('wazuh.github.moduleConfiguration.timeDelayLabel', {
      defaultMessage:
        'Time in seconds that each scan will monitor until that delay backwards',
    }),
  },
  {
    field: 'curl_max_size',
    label: i18n.translate('wazuh.github.moduleConfiguration.curlMaxSizeLabel', {
      defaultMessage: 'Maximum size allowed for the GitHub API response',
    }),
  },
  {
    field: 'interval',
    label: i18n.translate('wazuh.github.moduleConfiguration.intervalLabel', {
      defaultMessage: 'Interval between GitHub wodle executions in seconds',
    }),
  },
  {
    field: 'event_type',
    label: i18n.translate('wazuh.github.moduleConfiguration.eventTypeLabel', {
      defaultMessage: 'Event type',
    }),
  },
  {
    field: 'api_auth',
    label: i18n.translate(
      'wazuh.github.moduleConfiguration.organizationsLabel',
      {
        defaultMessage: 'Organizations',
      },
    ),
    render: value => {
      const organizations = toApiAuthEntries(value)
        .map(v => v.org_name)
        .filter(orgName => typeof orgName !== 'undefined');
      return organizations.length ? (
        organizations.map(orgName => (
          <EuiDescriptionList
            key={`module_configuration_api_auth_org_name_${orgName}`}
            className='eui-textTruncate'
            title={String(orgName)}
          >
            {String(orgName)}
          </EuiDescriptionList>
        ))
      ) : (
        <EuiText>
          {i18n.translate(
            'wazuh.github.moduleConfiguration.noOrganizationsConfigured',
            {
              defaultMessage: 'No organizations configured',
            },
          )}
        </EuiText>
      );
    },
  },
];

const mapWModuleConfigurationToRenderProperties = (
  wmodules: { [key: string]: any }[],
  wmoduleID: string,
  entity: string,
  name: string = '',
) => {
  const configuration = wmodules.find(
    wmodule => Object.keys(wmodule)[0] === wmoduleID,
  );
  return configuration
    ? {
        entity,
        name,
        configuration: configuration[Object.keys(configuration)[0]],
      }
    : null;
};

export const ModuleConfiguration = props => (
  <PanelModuleConfiguration
    moduleTitle='GitHub'
    moduleIconType={LogoGitHub}
    settings={settings}
    configurationAPIPartialPath='/wmodules/wmodules'
    documentationPath='cloud-security/github/index.html'
    mapResponseConfiguration={(response, type, params) => {
      return type === 'agent'
        ? mapModuleContentToRenderProperties(
            response,
            'github',
            i18n.translate('wazuh.github.moduleConfiguration.agentEntity', {
              defaultMessage: 'Agent',
            }),
            params.name,
          )
        : type === 'cluster_node'
        ? mapWModuleConfigurationToRenderProperties(
            response.data.data.affected_items[0].wmodules,
            'github',
            i18n.translate('wazuh.github.moduleConfiguration.managerEntity', {
              defaultMessage: 'Manager',
            }),
            params.name,
          )
        : mapWModuleConfigurationToRenderProperties(
            response.data.data.affected_items[0].wmodules,
            'github',
            i18n.translate('wazuh.github.moduleConfiguration.managerEntity', {
              defaultMessage: 'Manager',
            }),
          );
    }}
  />
);
