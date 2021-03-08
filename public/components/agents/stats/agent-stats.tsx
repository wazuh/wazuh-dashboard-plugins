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

import { withGlobalBreadcrumb, withReduxProvider, withGuard } from '../../common/hocs';
import { compose } from 'redux';
import { WzRequest, TimeService } from '../../../react-services';
import { AgentStatTable } from './table';
import { PromptNoActiveAgentWithoutSelect } from '../prompts';

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
    render: TimeService.offset
  },
  {
    title: 'Last keep alive',
    field: 'last_keepalive',
    render: TimeService.offset
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
  withGuard(({agent}) => agent.status !== 'active', PromptNoActiveAgentWithoutSelect),
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
      }catch(error){

      }
      setLoading(false);
    })()
  }, []);
  return (
    <>
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
    </>
  )
}
