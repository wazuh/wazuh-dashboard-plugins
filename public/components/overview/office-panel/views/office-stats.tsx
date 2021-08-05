/*
 * Wazuh app - React View OfficeStats.
 *
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { EuiDescriptionList, EuiPanel } from '@elastic/eui';
import moduleLogo from '../../../../assets/office365.svg';
import React from 'react';
import './office-stats.scss';
import { PanelModuleConfiguration } from '../../../common/modules/panel';

const settings = [
  { field: 'enabled', label: 'Enabled'},
  { field: 'only_future_events', label: 'Collect events generated since Wazuh agent was started'},
  { field: 'curl_max_size', label: 'Maximum size allowed for the Office 365 API response'},
  { field: 'interval', label: 'Interval between Office 365 wodle executions in seconds'},
  { field: 'api_auth', label: 'Credentials', render: (value) => value.map(v => 
    <EuiPanel paddingSize='s' key={`module_configuration_api_auth_${v.tenant_id}_${v.client_id}`}>
      <EuiDescriptionList listItems={[
        {title: 'Tenant ID', description: v.tenant_id},
        {title: 'Client ID', description: v.client_id},
        {title: 'Client secret', description: v.client_secret},
        {title: 'Path file of client secret', description: v.client_secret_path},
      ].filter(item => item.description !== undefined)}/>
    </EuiPanel>
  )},
  { field: 'subscriptions', label: 'Subscriptions', render: (value) => value
    .map(v => <EuiDescriptionList key={`module_configuration_subscriptions_${v}`}>{v}</EuiDescriptionList>)
  }
];

const mapWModuleConfigurationToRenderProperties = (wmodules: {[key: string]: any}[], wmoduleID: string, entity: string, name = '') => {
  const configuration = wmodules.find(wmodule => Object.keys(wmodule)[0] === wmoduleID);
  return configuration 
    ? {entity, name, configuration: configuration[Object.keys(configuration)[0]]}
    : null;
};

export const ModuleConfiguration = props => <PanelModuleConfiguration 
  moduleTitle='Office 365'
  moduleIconType={moduleLogo}
  settings={settings}
  configurationAPIPartialPath='/wmodules/wmodules'
  mapResponseConfiguration={(response, type, params) => {
    return type === 'agent'
      ? mapWModuleConfigurationToRenderProperties(response.data.data.wmodules, 'office365', 'Agent', params.name)
      : (type === 'cluster_node'
      ? mapWModuleConfigurationToRenderProperties(response.data.data.affected_items[0].wmodules, 'office365', 'Manager', params.name)
      : mapWModuleConfigurationToRenderProperties(response.data.data.affected_items[0].wmodules, 'office365', 'Manager')
    );
  }}
/>
