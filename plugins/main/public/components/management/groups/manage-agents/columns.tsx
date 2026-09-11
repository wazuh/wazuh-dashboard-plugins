import React from 'react';
import { AgentStatus } from '../../../agents/agent-status';

export const manageAgentsColumns = ({
  fullWidth = false,
}: { fullWidth?: boolean } = {}) => [
  {
    field: 'id',
    name: 'ID',
    sortable: true,
    show: true,
    searchable: true,
    width: fullWidth ? '9%' : '7%',
  },
  {
    field: 'name',
    name: 'Name',
    sortable: true,
    show: true,
    searchable: true,
    width: fullWidth ? '33%' : '25%',
  },
  {
    field: 'status',
    name: 'Status',
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
    name: 'Group(s)',
    sortable: true,
    show: true,
    width: fullWidth ? '27%' : '20%',
    render: (groups: string[]) => (groups || []).join(', '),
    searchable: true,
  },
];
