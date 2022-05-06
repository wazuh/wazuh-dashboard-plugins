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

const settings = [
  { field: 'enabled', label: 'Service status', render: renderValueNoThenEnabled },
  { field: 'only_future_events', label: 'Collect events generated since Wazuh agent was started'},
  { field: 'time_delay', label: 'Time in seconds that each scan will monitor until that delay backwards'},
  { field: 'curl_max_size', label: 'Maximum size allowed for the GitHub API response'},
  { field: 'interval', label: 'Interval between GitHub wodle executions in seconds'},
  { field: 'event_type', label: 'Event type'},
  { field: 'api_auth', label: 'Credentials', render: (value) => value.map(v => 
    <EuiPanel paddingSize='s' key={`module_configuration_api_auth_${v.org_name}_${v.client_id}`}>
      <EuiDescriptionList listItems={[
        {title: 'Organization', description: v.org_name},
        {title: 'Token', description: v.api_token}
      ].filter(item => typeof item.description !== 'undefined')}/>
    </EuiPanel>
  ).reduce((prev, cur) => [prev, <div key={`padding-len-${prev.length}`} style={{marginTop: '8px'}} /> , cur], [])}
];

const mapWModuleConfigurationToRenderProperties = (wmodules: {[key: string]: any}[], wmoduleID: string, entity: string, name: string = '') => {
  const configuration = wmodules.find(wmodule => Object.keys(wmodule)[0] === wmoduleID);
  return configuration 
    ? {entity, name, configuration: configuration[Object.keys(configuration)[0]]}
    : null;
};

export const ModuleConfiguration = props => <PanelModuleConfiguration 
  moduleTitle='GitHub'
  moduleIconType={LogoGitHub}
  settings={settings}
  configurationAPIPartialPath='/wmodules/wmodules'
  mapResponseConfiguration={(response, type, params) => {
    return type === 'agent'
      ? mapWModuleConfigurationToRenderProperties(response.data.data.wmodules, 'github', 'Agent', params.name)
      : (type === 'cluster_node'
      ? mapWModuleConfigurationToRenderProperties(response.data.data.affected_items[0].wmodules, 'github', 'Manager', params.name)
      : mapWModuleConfigurationToRenderProperties(response.data.data.affected_items[0].wmodules, 'github', 'Manager')
    );
  }}
/>
