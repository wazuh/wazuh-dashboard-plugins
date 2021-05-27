/*
 * Wazuh app - Component to display the Agent stats
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { useState, useEffect } from 'react';
import { 
  EuiFlexGroup,
  EuiFlexItem,
  EuiLoadingSpinner,
  EuiPanel,
  EuiPage,
  EuiPageBody,
  EuiSpacer,
  EuiText
} from '@elastic/eui';

import { withGlobalBreadcrumb, withReduxProvider, withGuard, withUserAuthorizationPrompt } from '../../common/hocs';
import { compose } from 'redux';
import { WzRequest, formatUIDate } from '../../../react-services';
import { AgentStatTable } from './table';
import { PromptNoActiveAgentWithoutSelect, PromptAgentFeatureVersion } from '../prompts';

const tableColumns = [
  {
    field: 'location',
    name: 'Location',
    sortable: true,
  },
  {
    field: 'events',
    name: 'Events',
    sortable: true,
  },
  {
    field: 'bytes',
    name: 'Bytes',
    sortable: true,
  }
];

const statsAgents: {title: string, field: string, render?: (value) => any}[] = [
  {
    title: 'Status',
    field: 'status',
  },
  {
    title: 'Buffer',
    field: 'buffer_enabled',
    render: (value) => value ? 'enabled' : 'disabled'
  },
  {
    title: 'Message buffer',
    field: 'msg_buffer'
  },
  {
    title: 'Messages count',
    field: 'msg_count'
  },
  {
    title: 'Messages sent',
    field: 'msg_sent'
  },
  {
    title: 'Last ack',
    field: 'last_ack',
    render: formatUIDate
  },
  {
    title: 'Last keep alive',
    field: 'last_keepalive',
    render: formatUIDate
  }
];

export const MainAgentStats = compose(
  withReduxProvider,
  withGlobalBreadcrumb(({agent}) => [
    {
      text: ''
    },
    {
      text: 'Agents',
      href: "#/agents-preview"
    },
    { agent },
    {
      text: 'Stats'
    },
  ]),
  withUserAuthorizationPrompt(({agent}) => [[
    {action: 'agent:read', resource: `agent:id:${agent.id}`}, 
    ...(agent.group || []).map(group => ({ action: 'agent:read', resource: `agent:group:${group}` }))
  ]]),
  withGuard(({agent}) => agent.status !== 'active', PromptNoActiveAgentWithoutSelect),
  withGuard(({agent}) => {
    const [major, minor, patch] = agent.version.replace('Wazuh v','').split('.').map(value => parseInt(value));
    return !(major >= 4 && minor >= 2 && patch >= 0)
  }, () => <PromptAgentFeatureVersion version='equal or higher version than 4.2.0'/>)
)(AgentStats);

function AgentStats({agent}){
  const [loading, setLoading] = useState();
  const [dataStatwmodulesd, setDataStatwmodulesd] = useState({});
  const [dataStatAgent, setDataStatAgent] = useState();
  useEffect(() => {
    (async function(){
      setLoading(true);
      try{
        const responseDataStatwmodulesd = await WzRequest.apiReq('GET', `/agents/${agent.id}/stats/wmodulesd`, {});
        const responseDataStatAgent = await WzRequest.apiReq('GET', `/agents/${agent.id}/stats/agent`, {});
        setDataStatwmodulesd(responseDataStatwmodulesd?.data?.data?.affected_items?.[0] || {});
        setDataStatAgent(responseDataStatAgent?.data?.data?.affected_items?.[0] || undefined);
      }catch(error){

      }
      setLoading(false);
    })()
  }, []);
  return (
    <EuiPage>
      <EuiPageBody>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiPanel paddingSize="m">
              <EuiFlexGroup>
                {statsAgents.map(stat => (
                  <EuiFlexItem key={`agent-stat-${stat.field}`} grow={false}>
                    <EuiText>{stat.title}: {loading ? <EuiLoadingSpinner size="s" /> : <strong>{dataStatAgent !== undefined ? (stat.render ? stat.render(dataStatAgent[stat.field]) : dataStatAgent?.[stat.field]) : '-'}</strong>}</EuiText>
                  </EuiFlexItem>
                ))}
              </EuiFlexGroup>
            </EuiPanel>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer />
        <EuiFlexGroup>
          <EuiFlexItem>
            <AgentStatTable
              columns={tableColumns}
              loading={loading}
              title='Global'
              start={dataStatwmodulesd?.global?.start}
              end={dataStatwmodulesd?.global?.end}
              items={dataStatwmodulesd?.global?.files}
              exportCSVFilename={`agent-stats-${agent.id}-wmodulesd-global`}
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <AgentStatTable
              columns={tableColumns}
              loading={loading}
              title='Interval'
              start={dataStatwmodulesd?.interval?.start}
              end={dataStatwmodulesd?.interval?.end}
              items={dataStatwmodulesd?.interval?.files}
              exportCSVFilename={`agent-stats-${agent.id}-wmodulesd-interval`}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPageBody>
    </EuiPage>
  )
}
