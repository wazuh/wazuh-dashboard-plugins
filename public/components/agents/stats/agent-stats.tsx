/*
 * Wazuh app - Component to display the Agent stats
 * Copyright (C) 2015-2022 Wazuh, Inc.
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

import { withGlobalBreadcrumb, withReduxProvider, withGuard, withUserAuthorizationPrompt, withErrorBoundary } from '../../common/hocs';
import { compose } from 'redux';
import { WzRequest, formatUIDate } from '../../../react-services';
import { AgentStatTable } from './table';
import { PromptNoActiveAgentWithoutSelect, PromptAgentFeatureVersion } from '../prompts';
import {
  UIErrorLog,
  UI_ERROR_SEVERITIES,
  UILogLevel,
  UIErrorSeverity,
} from '../../../react-services/error-orchestrator/types';
import { API_NAME_AGENT_STATUS, UI_LOGGER_LEVELS } from '../../../../common/constants';
import { getErrorOrchestrator } from '../../../react-services/common-services';

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
  withErrorBoundary,
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
  withGuard(({agent}) => agent.status !== API_NAME_AGENT_STATUS.ACTIVE, PromptNoActiveAgentWithoutSelect),
  withGuard(({agent}) => {
    const [major, minor, patch] = agent.version.replace('Wazuh v','').split('.').map(value => parseInt(value));
    return !(major >= 4 && minor >= 2 && patch >= 0)
  }, () => <PromptAgentFeatureVersion version='equal or higher version than 4.2.0'/>)
)(AgentStats);

function AgentStats({agent}){
  const [loading, setLoading] = useState();
  const [dataStatLogcollector, setDataStatLogcollector] = useState({});
  const [dataStatAgent, setDataStatAgent] = useState();
  useEffect(() => {
    (async function(){
      setLoading(true);
      try{
        const responseDataStatLogcollector = await WzRequest.apiReq('GET', `/agents/${agent.id}/stats/logcollector`, {});
        const responseDataStatAgent = await WzRequest.apiReq('GET', `/agents/${agent.id}/stats/agent`, {});
        setDataStatLogcollector(responseDataStatLogcollector?.data?.data?.affected_items?.[0] || {});
        setDataStatAgent(responseDataStatAgent?.data?.data?.affected_items?.[0] || undefined);
      } catch(error) {
        const options: UIErrorLog = {
          context: `${AgentStats.name}.useEffect`,
          level: UI_LOGGER_LEVELS.ERROR as UILogLevel,
          severity: UI_ERROR_SEVERITIES.BUSINESS as UIErrorSeverity,
          error: {
            error: error,
            message: error.message || error,
            title: error.name || error,
          },
        };
        getErrorOrchestrator().handleError(options);
      } finally {
        setLoading(false);
      }
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
              start={dataStatLogcollector?.global?.start}
              end={dataStatLogcollector?.global?.end}
              items={dataStatLogcollector?.global?.files}
              exportCSVFilename={`agent-stats-${agent.id}-logcollector-global`}
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <AgentStatTable
              columns={tableColumns}
              loading={loading}
              title='Interval'
              start={dataStatLogcollector?.interval?.start}
              end={dataStatLogcollector?.interval?.end}
              items={dataStatLogcollector?.interval?.files}
              exportCSVFilename={`agent-stats-${agent.id}-logcollector-interval`}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPageBody>
    </EuiPage>
  )
}
