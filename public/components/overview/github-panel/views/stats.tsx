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

import React from 'react';
import { EuiDescriptionList, EuiPanel } from '@elastic/eui';
import { PanelModuleConfiguration } from '../../../common/modules/panel';
import { renderValueNoThenEnabled } from '../../../../controllers/management/components/management/configuration/utils/utils';
import { LogoGitHub } from '../../../common/logos';
import { i18n } from '@kbn/i18n';
const label1 = i18n.translate('wazuh.components.overview.github.panel.label1', {
  defaultMessage: 'Service status',
});
const label3 = i18n.translate('wazuh.components.overview.github.panel.label3', {
  defaultMessage: 'Collect events generated since Wazuh agent was started',
});
const label4 = i18n.translate('wazuh.components.overview.github.panel.label4', {
  defaultMessage:
    'Time in seconds that each scan will monitor until that delay backwards',
});
const label5 = i18n.translate('wazuh.components.overview.github.panel.label5', {
  defaultMessage: 'Maximum size allowed for the GitHub API response',
});
const label6 = i18n.translate('wazuh.components.overview.github.panel.label6', {
  defaultMessage: 'Interval between GitHub wodle executions in seconds',
});
const label7 = i18n.translate('wazuh.components.overview.github.panel.label7', {
  defaultMessage: 'Event type',
});
const label8 = i18n.translate('wazuh.components.overview.github.panel.label8', {
  defaultMessage: 'Credentials',
});
const settings = [
  {
    field: 'enabled',
    label: label1,
    render: renderValueNoThenEnabled,
  },
  {
    field: 'only_future_events',
    label: label3,
  },
  {
    field: 'time_delay',
    label: label4,
  },
  {
    field: 'curl_max_size',
    label: label5,
  },
  {
    field: 'interval',
    label: label6,
  },
  { field: 'event_type', label: label7 },
  {
    field: 'api_auth',
    label: label8,
    render: value =>
      value
        .map(v => (
          <EuiPanel
            paddingSize='s'
            key={`module_configuration_api_auth_${v.org_name}_${v.client_id}`}
          >
            <EuiDescriptionList
              listItems={[
                { title: { title2 }, description: v.org_name },
                { title: { title3 }, description: v.api_token },
              ].filter(item => typeof item.description !== 'undefined')}
            />
          </EuiPanel>
        ))
        .reduce(
          (prev, cur) => [
            prev,
            <div
              key={`padding-len-${prev.length}`}
              style={{ marginTop: '8px' }}
            />,
            cur,
          ],
          [],
        ),
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
const title1 = i18n.translate('wazuh.components.overview.githubPanel.github', {
  defaultMessage: 'GitHub',
});
const title2 = i18n.translate(
  'wazuh.components.overview.githubPanel.stats.organization',
  {
    defaultMessage: 'Organization',
  },
);
const title3 = i18n.translate('wazuh.components.overview.githubPanel.token', {
  defaultMessage: 'Token',
});

export const ModuleConfiguration = props => (
  <PanelModuleConfiguration
    moduleTitle={title1}
    moduleIconType={LogoGitHub}
    settings={settings}
    configurationAPIPartialPath='/wmodules/wmodules'
    mapResponseConfiguration={(response, type, params) => {
      return type === 'agent'
        ? mapWModuleConfigurationToRenderProperties(
            response.data.data.wmodules,
            'github',
            'Agent',
            params.name,
          )
        : type === 'cluster_node'
        ? mapWModuleConfigurationToRenderProperties(
            response.data.data.affected_items[0].wmodules,
            'github',
            'Manager',
            params.name,
          )
        : mapWModuleConfigurationToRenderProperties(
            response.data.data.affected_items[0].wmodules,
            'github',
            'Manager',
          );
    }}
  />
);
