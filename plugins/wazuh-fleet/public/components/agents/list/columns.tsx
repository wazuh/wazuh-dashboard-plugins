import React from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiHealth,
  EuiToolTip,
  EuiLink,
} from '@elastic/eui';
import { getCore } from '../../../plugin-services';
import { IAgentResponse } from '../../../../common/types';
import { AgentGroups, HostOS } from '../../common';
import { AGENTS_SUMMARY_ID } from '../../../groups/agents/applications';
import { tDataGridColumn } from '../../common/data-grid';

export const agentsTableColumns: tDataGridColumn[] = [
  {
    id: 'agent.name',
    displayAsText: 'Name / ID',
    isSortable: true,
    searchable: true,
    render: (id: string, agentData: IAgentResponse) => (
      <EuiFlexGroup direction='column' gutterSize='none'>
        <EuiFlexItem>
          <EuiToolTip content={agentData.agent.id}>
            <EuiLink
              href={getCore().application.getUrlForApp(AGENTS_SUMMARY_ID, {
                path: `#/agents/${agentData.agent.id}`,
              })}
            >
              {id}
            </EuiLink>
          </EuiToolTip>
        </EuiFlexItem>
      </EuiFlexGroup>
    ),
  },
  {
    id: 'agent.groups',
    displayAsText: 'Groups',
    isSortable: true,
    render: (groups: string[]) => <AgentGroups groups={groups} />,
  },
  {
    id: 'agent.version',
    displayAsText: 'Version',
    isSortable: true,
    initialWidth: 100,
    render: (version: string) => {
      const isOutdated = false;
      // const isOutdated = !!outdatedAgents.find(
      //   outdatedAgent => outdatedAgent.id === agent.id,
      // );

      return (
        <EuiFlexGroup
          wrap={false}
          responsive={false}
          gutterSize='xs'
          alignItems='center'
        >
          <EuiFlexItem grow={false}>{version}</EuiFlexItem>
          {isOutdated ? (
            <EuiFlexItem grow={false}>
              <EuiToolTip content={<p>Outdated</p>}>
                <EuiHealth className='wz-flex' color='danger'></EuiHealth>
              </EuiToolTip>
            </EuiFlexItem>
          ) : null}
        </EuiFlexGroup>
      );
    },
  },
  {
    id: 'agent.host.os.full',
    displayAsText: 'Host OS',
    isSortable: true,
    render: (field: string, agentData: IAgentResponse) => (
      <HostOS os={agentData.agent.host?.os} />
    ),
  },
  {
    id: 'agent.host.ip',
    displayAsText: 'Host IP',
    isSortable: true,
    initialWidth: 140,
  },
  {
    id: 'agent.status',
    displayAsText: 'Status',
    isSortable: true,
    // render: (status, agent) => <AgentStatus status={status} agent={agent} />,
  },
];
