import React from 'react';
import { agentsTableActions } from './actions/actions';
import { AgentStatus } from '../../agents/agent-status';
import { formatUIDate } from '../../../react-services/time-service';
import { GroupTruncate } from '../../common/util';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiIconTip,
  EuiHealth,
  EuiToolTip,
  EuiBadge,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { Agent } from '../types';
import WzIconSVG from '../../common/icons/wz-icon-svg';
import { getAgentOSType } from '../../../react-services';
import { isVersionLower } from './utils';

type SetModalIsVisible = (visible: boolean) => void;

// Columns with the property truncateText: true won't wrap the text
// This is added to prevent the wrap because of the table-layout: auto
export const agentsTableColumns = (
  setAgent: (agents: Agent) => void,
  setIsEditGroupsVisible: SetModalIsVisible,
  setIsUpgradeModalVisible: SetModalIsVisible,
  setFilters: (filters) => void,
  apiVersion: string,
  {
    // TODO: consider moving the positional arguments to this to avoid bug related to position and allow to extend easily.
    setIsRemoveModalVisible,
    setIsScanVulnerabilitiesModalVisible,
    pendingUpgradeAgentIds = new Set<string>(),
  }: {
    setIsRemoveModalVisible: SetModalIsVisible;
    setIsScanVulnerabilitiesModalVisible: SetModalIsVisible;
    pendingUpgradeAgentIds?: Set<string>;
  },
) => [
  {
    field: 'id',
    name: i18n.translate('wazuh.endpointsSummary.agentsTableColumns.id', {
      defaultMessage: 'ID',
    }),
    sortable: true,
    show: true,
    searchable: true,
  },
  {
    field: 'name',
    name: i18n.translate('wazuh.endpointsSummary.agentsTableColumns.name', {
      defaultMessage: 'Name',
    }),
    sortable: true,
    show: true,
    searchable: true,
  },
  {
    field: 'ip',
    name: i18n.translate(
      'wazuh.endpointsSummary.agentsTableColumns.ipAddress',
      {
        defaultMessage: 'IP address',
      },
    ),
    sortable: true,
    show: true,
    searchable: true,
  },
  {
    field: 'group',
    name: i18n.translate('wazuh.endpointsSummary.agentsTableColumns.groups', {
      defaultMessage: 'Group(s)',
    }),
    sortable: true,
    show: true,
    render: groups => renderGroups(groups, setFilters),
    searchable: true,
  },
  {
    field: 'os.name,os.version',
    composeField: ['os.name', 'os.version'],
    name: i18n.translate(
      'wazuh.endpointsSummary.agentsTableColumns.operatingSystem',
      {
        defaultMessage: 'Operating system',
      },
    ),
    sortable: true,
    show: true,
    render: (field: any, agentData: Agent) => addIconPlatformRender(agentData),
    searchable: true,
  },
  {
    field: 'version',
    name: i18n.translate('wazuh.endpointsSummary.agentsTableColumns.version', {
      defaultMessage: 'Version',
    }),
    sortable: true,
    show: true,
    searchable: true,
    width: '100px',
    render: (version: string) => {
      const isOutdated = isVersionLower(version, apiVersion);
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
              <EuiToolTip
                content={
                  <p>
                    {i18n.translate(
                      'wazuh.endpointsSummary.agentsTableColumns.outdatedTooltip',
                      {
                        defaultMessage: 'Outdated',
                      },
                    )}
                  </p>
                }
              >
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
        {i18n.translate(
          'wazuh.endpointsSummary.agentsTableColumns.registrationDate',
          {
            defaultMessage: 'Registration date',
          },
        )}{' '}
        <EuiIconTip
          content={i18n.translate(
            'wazuh.endpointsSummary.agentsTableColumns.registrationDateNotSearchableTooltip',
            {
              defaultMessage: 'This is not searchable through a search term.',
            },
          )}
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
        {i18n.translate(
          'wazuh.endpointsSummary.agentsTableColumns.lastKeepAlive',
          {
            defaultMessage: 'Last keep alive',
          },
        )}{' '}
        <EuiIconTip
          content={i18n.translate(
            'wazuh.endpointsSummary.agentsTableColumns.lastKeepAliveNotSearchableTooltip',
            {
              defaultMessage: 'This is not searchable through a search term.',
            },
          )}
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
    name: i18n.translate('wazuh.endpointsSummary.agentsTableColumns.status', {
      defaultMessage: 'Status',
    }),
    truncateText: true,
    sortable: true,
    show: true,
    render: (status, agent: Agent) => (
      <EuiFlexGroup
        wrap={false}
        responsive={false}
        gutterSize='xs'
        alignItems='center'
      >
        <EuiFlexItem grow={false}>
          <AgentStatus status={status} agent={agent} />
        </EuiFlexItem>
        {pendingUpgradeAgentIds.has(agent.id) ? (
          <EuiFlexItem grow={false}>
            <EuiToolTip
              content={
                <p>
                  {i18n.translate(
                    'wazuh.endpointsSummary.agentsTableColumns.upgradingTooltip',
                    {
                      defaultMessage:
                        'Upgrade request sent. This may take a few minutes.',
                    },
                  )}
                </p>
              }
            >
              <EuiBadge color='primary'>
                {i18n.translate(
                  'wazuh.endpointsSummary.agentsTableColumns.upgradingBadge',
                  {
                    defaultMessage: 'Upgrading',
                  },
                )}
              </EuiBadge>
            </EuiToolTip>
          </EuiFlexItem>
        ) : null}
      </EuiFlexGroup>
    ),
  },
  {
    field: 'actions',
    name: i18n.translate('wazuh.endpointsSummary.agentsTableColumns.actions', {
      defaultMessage: 'Actions',
    }),
    show: true,
    actions: agentsTableActions(
      setAgent,
      setIsEditGroupsVisible,
      setIsUpgradeModalVisible,
      apiVersion,
      { setIsRemoveModalVisible, setIsScanVulnerabilitiesModalVisible },
    ),
  },
];

const addIconPlatformRender = (agent: Agent) => {
  const osType = getAgentOSType(agent);
  const os_name = `${agent?.os?.name || ''} ${agent?.os?.version || ''}`;

  return (
    <EuiFlexGroup gutterSize='xs' alignItems='center' responsive={false}>
      <EuiFlexItem grow={false}>
        <WzIconSVG type={osType} style={{ paddingRight: '3px' }} />
      </EuiFlexItem>
      <EuiFlexItem>{os_name.trim() || '-'}</EuiFlexItem>
    </EuiFlexGroup>
  );
};

const filterGroupBadge = (group: string, setFilters: any) => {
  setFilters({
    q: `group=${group}`,
  });
};

const renderGroups = (groups: string[], setFilters: any) => {
  return groups?.length ? (
    <GroupTruncate
      groups={groups}
      length={25}
      label={i18n.translate(
        'wazuh.endpointsSummary.agentsTableColumns.moreGroupsLabel',
        {
          defaultMessage: 'more',
        },
      )}
      action={'filter'}
      filterAction={group => filterGroupBadge(group, setFilters)}
    />
  ) : null;
};
