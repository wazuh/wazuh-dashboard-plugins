import React from 'react';
import { agentsTableActions } from './actions/actions';
import { AgentSynced } from '../../agents/agent-synced';
import { AgentStatus } from '../../agents/agent-status';
import { formatUIDate } from '../../../react-services/time-service';
import { GroupTruncate } from '../../common/util';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiIconTip,
  EuiHealth,
  EuiToolTip,
} from '@elastic/eui';
import { Agent } from '../types';

// Columns with the property truncateText: true won't wrap the text
// This is added to prevent the wrap because of the table-layout: auto
export const agentsTableColumns = (
  allowEditGroups: boolean,
  allowUpgrade: boolean,
  setAgent: (agents: Agent) => void,
  setIsEditGroupsVisible: (visible: boolean) => void,
  setIsUpgradeModalVisible: (visible: boolean) => void,
  setFilters: (filters) => void,
  outdatedAgents: Agent[],
) => [
  {
    field: 'id',
    name: 'ID',
    sortable: true,
    show: true,
    searchable: true,
  },
  {
    field: 'name',
    name: 'Name',
    sortable: true,
    show: true,
    searchable: true,
  },
  {
    field: 'ip',
    name: 'IP address',
    sortable: true,
    show: true,
    searchable: true,
  },
  {
    field: 'group',
    name: 'Group(s)',
    sortable: true,
    show: true,
    render: groups => renderGroups(groups, setFilters),
    searchable: true,
  },
  {
    field: 'os.name,os.version',
    composeField: ['os.name', 'os.version'],
    name: 'Operating system',
    sortable: true,
    show: true,
    render: (field, agentData) => addIconPlatformRender(agentData),
    searchable: true,
  },
  {
    field: 'node_name',
    name: 'Cluster node',
    sortable: true,
    show: true,
    searchable: true,
  },
  {
    field: 'version',
    name: 'Version',
    sortable: true,
    show: true,
    searchable: true,
    width: '100px',
    render: (version, agent) => {
      const isOutdated = !!outdatedAgents.find(
        outdatedAgent => outdatedAgent.id === agent.id,
      );
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
    field: 'dateAdd',
    name: (
      <span>
        Registration date{' '}
        <EuiIconTip
          content='This is not searchable through a search term.'
          size='s'
          color='subdued'
          type='alert'
        />
      </span>
    ),
    render: dateAdd => formatUIDate(dateAdd),
    sortable: true,
    show: false,
    searchable: false,
  },
  {
    field: 'lastKeepAlive',
    name: (
      <span>
        Last keep alive{' '}
        <EuiIconTip
          content='This is not searchable through a search term.'
          size='s'
          color='subdued'
          type='alert'
        />
      </span>
    ),
    render: lastKeepAlive => formatUIDate(lastKeepAlive),
    sortable: true,
    show: false,
    searchable: false,
  },
  {
    field: 'status',
    name: 'Status',
    truncateText: true,
    sortable: true,
    show: true,
    render: (status, agent) => <AgentStatus status={status} agent={agent} />,
  },
  {
    field: 'group_config_status',
    name: 'Synced',
    sortable: true,
    show: false,
    render: synced => <AgentSynced synced={synced} />,
    searchable: true,
  },
  {
    field: 'actions',
    name: 'Actions',
    show: true,
    actions: agentsTableActions(
      allowEditGroups,
      allowUpgrade,
      setAgent,
      setIsEditGroupsVisible,
      setIsUpgradeModalVisible,
      outdatedAgents,
    ),
  },
];

const addIconPlatformRender = agent => {
  let icon = '';
  const os = agent?.os || {};

  if ((os?.uname || '').includes('Linux')) {
    icon = 'linux';
  } else if (os?.platform === 'windows') {
    icon = 'windows';
  } else if (os?.platform === 'darwin') {
    icon = 'apple';
  }
  const os_name = `${agent?.os?.name || ''} ${agent?.os?.version || ''}`;

  return (
    <EuiFlexGroup gutterSize='xs'>
      <EuiFlexItem grow={false}>
        <i
          className={`fa fa-${icon} AgentsTable__soBadge AgentsTable__soBadge--${icon}`}
          aria-hidden='true'
        ></i>
      </EuiFlexItem>{' '}
      <EuiFlexItem>{os_name.trim() || '-'}</EuiFlexItem>
    </EuiFlexGroup>
  );
};

const filterGroupBadge = (group: string, setFilters: any) => {
  setFilters({
    default: { q: 'id!=000' },
    q: `id!=000;group=${group}`,
  });
};

const renderGroups = (groups: string[], setFilters: any) => {
  return groups?.length ? (
    <GroupTruncate
      groups={groups}
      length={25}
      label={'more'}
      action={'filter'}
      filterAction={group => filterGroupBadge(group, setFilters)}
    />
  ) : null;
};
