import React from 'react';
import { agentsTableActions } from './actions/actions';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiHealth,
  EuiToolTip,
  EuiText,
  EuiLink,
} from '@elastic/eui';
import { getCore, getWazuhCore } from '../../../plugin-services';
import { Agent } from '../../../../common/types';
import { AgentGroups, HostOS } from '../../common';

export const agentsTableColumns = ({
  setIsFlyoutAgentVisible,
  setAgent,
}: {
  setIsFlyoutAgentVisible: (isVisible: boolean) => void;
  setAgent: (agent: Agent) => void;
  // allowEditGroups: boolean,
  // allowUpgrade: boolean,
  // setAgent: (agents: Agent) => void,
  // setIsEditGroupsVisible: (visible: boolean) => void,
  // setIsUpgradeModalVisible: (visible: boolean) => void,
  // setFilters: (filters) => void,
  // outdatedAgents: Agent[],
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
            href={getCore().application.getUrlForApp('fleet-management', {
              path: `#/fleet-management/agents/${agentData.agent.id}`,
            })}
          >
            {agentData.agent.name}
          </EuiLink>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiToolTip content={agentData.agent.id}>
            <EuiText color='subdued' size='xs'>
              {`${agentData.agent.id.substring(0, 14)}...`}
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
    field: 'wazuh.cluster.name',
    name: 'Cluster node',
    sortable: true,
    show: true,
    searchable: true,
    width: '140px',
  },
  {
    field: 'agent.version',
    name: 'Version',
    sortable: true,
    show: true,
    searchable: true,
    width: '100px',
    render: (version: string, agent: any) => {
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
    field: 'host.os.name,host.os.version',
    composeField: ['host.os.name', 'host.os.version'],
    name: 'Host OS',
    sortable: true,
    show: true,
    render: (field: string, agentData: Agent) => (
      <HostOS os={agentData.host.os} />
    ),
    searchable: true,
  },
  {
    field: 'host.ip',
    name: 'Host IP',
    sortable: true,
    show: true,
    searchable: true,
    width: '140px',
  },
  // {
  //   field: 'lastKeepAlive',
  //   name: (
  //     <span>
  //       Last keep alive{' '}
  //       <EuiIconTip
  //         content='This is not searchable through a search term.'
  //         size='s'
  //         color='subdued'
  //         type='alert'
  //       />
  //     </span>
  //   ),
  //   render: lastKeepAlive => formatUIDate(lastKeepAlive),
  //   sortable: true,
  //   show: false,
  //   searchable: false,
  // },
  // {
  //   field: 'status',
  //   name: 'Status',
  //   truncateText: true,
  //   sortable: true,
  //   show: true,
  //   render: (status, agent) => <AgentStatus status={status} agent={agent} />,
  // },
  // {
  //   field: 'group_config_status',
  //   name: 'Synced',
  //   sortable: true,
  //   show: false,
  //   render: synced => <AgentSynced synced={synced} />,
  //   searchable: true,
  // },
  {
    field: 'agent.last_login',
    name: 'Last login',
    render: (last_login: Date) => {
      const { utils } = getWazuhCore();
      return utils.formatUIDate(last_login);
    },
    sortable: true,
    show: false,
    searchable: false,
  },
  {
    field: 'actions',
    name: 'Actions',
    show: true,
    actions: agentsTableActions({ setIsFlyoutAgentVisible, setAgent }),
    // allowEditGroups,
    // allowUpgrade,
    // setAgent,
    // setIsEditGroupsVisible,
    // setIsUpgradeModalVisible,
    // outdatedAgents,
  },
];
