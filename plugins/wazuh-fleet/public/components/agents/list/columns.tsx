import React from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiHealth,
  EuiToolTip,
  EuiText,
  EuiLink,
} from '@elastic/eui';
import { getCore } from '../../../plugin-services';
import { Agent } from '../../../../common/types';
import { AgentGroups, HostOS } from '../../common';
import { agentsTableActions } from './actions/actions';

export const agentsTableColumns = ({
  setIsFlyoutAgentVisible,
  setAgent,
}: {
  setIsFlyoutAgentVisible: (isVisible: boolean) => void;
  setAgent: (agent: Agent) => void;
}) => [
  {
    field: 'agent.name',
    name: 'Name / ID',
    sortable: true,
    show: true,
    searchable: true,
    render: (field: string, agentData: Agent) => (
      <EuiFlexGroup direction='column' gutterSize='none'>
        <EuiFlexItem>
          <EuiLink
            href={getCore().application.getUrlForApp('wazuh-fleet', {
              path: `#/agents/${agentData.agent.id}`,
            })}
          >
            {field}
          </EuiLink>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiToolTip content={field}>
            <EuiText color='subdued' size='xs'>
              {`${agentData.agent.id.slice(0, 14)}...`}
            </EuiText>
          </EuiToolTip>
        </EuiFlexItem>
      </EuiFlexGroup>
    ),
  },
  {
    field: 'agent.groups',
    name: 'Groups',
    sortable: true,
    show: true,
    render: (groups: string[]) => <AgentGroups groups={groups} />,
    searchable: true,
  },
  {
    field: 'agent.version',
    name: 'Version',
    sortable: true,
    show: true,
    searchable: true,
    width: '100px',
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
    field: 'agent.host.os.name,agent.host.os.version',
    composeField: ['host.os.name', 'host.os.version'],
    name: 'Host OS',
    sortable: true,
    show: true,
    render: (field: string, agentData: Agent) => (
      <HostOS os={agentData.agent.host.os} />
    ),
    searchable: true,
  },
  {
    field: 'agent.host.ip',
    name: 'Host IP',
    sortable: true,
    show: true,
    searchable: true,
    width: '140px',
  },
  {
    field: 'agent.status',
    name: 'Status',
    truncateText: true,
    sortable: true,
    show: true,
    // render: (status, agent) => <AgentStatus status={status} agent={agent} />,
  },
  {
    field: 'actions',
    name: 'Actions',
    show: true,
    actions: agentsTableActions({ setIsFlyoutAgentVisible, setAgent }),
  },
];
