import React from 'react';
import { i18n } from '@osd/i18n';
import { AgentStatus } from '../../../agents/agent-status';

export const manageAgentsColumns = ({
  fullWidth = false,
}: { fullWidth?: boolean } = {}) => [
  {
    field: 'id',
    name: i18n.translate('wazuh.endpointGroups.manageAgents.idColumn', {
      defaultMessage: 'ID',
    }),
    sortable: true,
    show: true,
    searchable: true,
    width: fullWidth ? '9%' : '7%',
  },
  {
    field: 'name',
    name: i18n.translate('wazuh.endpointGroups.manageAgents.nameColumn', {
      defaultMessage: 'Name',
    }),
    sortable: true,
    show: true,
    searchable: true,
    width: fullWidth ? '33%' : '25%',
  },
  {
    field: 'status',
    name: i18n.translate('wazuh.endpointGroups.manageAgents.statusColumn', {
      defaultMessage: 'Status',
    }),
    sortable: true,
    show: true,
    width: fullWidth ? '31%' : '24%',
    render: (status: string, agent: any) => (
      <AgentStatus status={status} agent={agent} />
    ),
    searchable: true,
  },
  {
    field: 'group',
    name: i18n.translate('wazuh.endpointGroups.manageAgents.groupsColumn', {
      defaultMessage: 'Group(s)',
    }),
    sortable: true,
    show: true,
    width: fullWidth ? '27%' : '20%',
    render: (groups: string[]) => (groups || []).join(', '),
    searchable: true,
  },
];
