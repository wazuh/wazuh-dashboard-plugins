import React from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiHealth,
  EuiToolTip,
  EuiText,
  EuiBadge,
  EuiLink,
  EuiIcon,
} from '@elastic/eui';
import { getCore, getWazuhCore } from '../../../plugin-services';
import { AgentGroups, HostOS } from '../../common';

function capitalizeFirstLetter(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export const columnsTableActions = ({
  setIsFlyoutAgentVisible,
  setCommand,
}: {
  setIsFlyoutAgentVisible: (isVisible: boolean) => void;
  setCommand: (command) => void;
}) => [
  {
    name: 'View agent details',
    description: 'View agent details',
    icon: 'eye',
    type: 'icon',
    isPrimary: true,
    color: 'primary',
    onClick: item => {
      setCommand(item);
      setIsFlyoutAgentVisible(true);
    },
  },
];

export const tableColumns = ({
  setIsFlyoutAgentVisible,
  setCommand,
}: {
  setIsFlyoutAgentVisible: (isVisible: boolean) => void;
  setCommand: (command) => void;
}) => [
  {
    field: 'agent.id',
    name: 'Agent ID',
    sortable: true,
    show: true,
    searchable: true,
    width: '140px',
    render: (field: string, commandData) => (
      <EuiFlexGroup direction='column' gutterSize='none'>
        <EuiFlexItem>
          <EuiToolTip content={commandData?.agent?.id ?? '-'}>
            <EuiText color='subdued' size='s'>
              {`${commandData?.agent?.id?.substring(0, 14) ?? '-'}...`}
            </EuiText>
          </EuiToolTip>
        </EuiFlexItem>
      </EuiFlexGroup>
    ),
  },
  {
    field: 'process.name',
    name: 'Name',
    sortable: true,
    show: true,
    searchable: true,
    width: '100px',
  },
  {
    field: 'process.command_line',
    name: 'Command line',
    sortable: true,
    show: true,
    searchable: true,
  },
  {
    field: 'args',
    name: 'Args',
    sortable: true,
    show: true,
    searchable: true,
    width: '230px',
    render: (value: string[]) => {
      return (
        <EuiFlexGroup responsive={false} wrap gutterSize='xs'>
          {value?.slice(0, 2).map(item => (
            <EuiFlexItem grow={false}>
              <EuiBadge color='hollow'>{item}</EuiBadge>
            </EuiFlexItem>
          ))}
        </EuiFlexGroup>
      );
    },
  },
  {
    field: 'info',
    name: 'Info',
    sortable: true,
    show: true,
    searchable: true,
  },
  {
    field: 'process.start',
    name: 'Start',
    sortable: true,
    show: true,
    searchable: true,
    render: (value: Date) => {
      const { utils } = getWazuhCore();
      return utils.formatUIDate(value);
    },
  },
  {
    field: 'process.end',
    name: 'End',
    sortable: true,
    show: true,
    searchable: true,
    render: (value: Date) => {
      const { utils } = getWazuhCore();
      return utils.formatUIDate(value);
    },
  },
  {
    field: 'status',
    name: 'Status',
    sortable: true,
    show: true,
    searchable: true,
    render: (value: string) => {
      let status = ['pending', 'sent', 'completed', 'failed'];
      let colors = ['warning', 'primary', 'success', 'danger'];

      return (
        <EuiFlexGroup>
          <EuiFlexItem grow={false} style={{ marginRight: 0 }}>
            <EuiHealth color={colors[status.indexOf(value)]} />
          </EuiFlexItem>
          <EuiFlexItem grow={false} style={{ marginLeft: 0 }}>
            <EuiText>{capitalizeFirstLetter(value)}</EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
      );
    },
  },
  {
    field: 'actions',
    name: 'Actions',
    show: true,
    width: '100px',
    actions: columnsTableActions({ setIsFlyoutAgentVisible, setCommand }),
  },
];
