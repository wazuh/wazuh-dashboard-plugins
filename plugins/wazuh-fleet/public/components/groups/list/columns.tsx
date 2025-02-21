import React from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiToolTip,
  EuiText,
  EuiLink,
} from '@elastic/eui';
import { Group } from '../../../../common/types';
import { getCore } from '../../../plugin-services';
import { tableActions } from './actions/actions';

export const groupsTableColumns = ({
  setIsFlyoutVisible,
  setGroup,
}: {
  setIsFlyoutVisible: (isVisible: boolean) => void;
  setGroup: (group: Group) => void;
}) => [
  {
    field: 'id',
    name: 'ID',
    sortable: true,
    show: true,
    searchable: true,
    render: (field: string) => (
      <EuiFlexGroup direction='column' gutterSize='none'>
        <EuiFlexItem>
          <EuiToolTip content={field}>
            <EuiText size='s'>{`${field?.slice(0, 22)}...`}</EuiText>
          </EuiToolTip>
        </EuiFlexItem>
      </EuiFlexGroup>
    ),
  },
  {
    field: 'name',
    name: 'Name',
    sortable: true,
    show: true,
    searchable: true,
    render: (field: string, data: Group) => (
      <EuiFlexGroup direction='column' gutterSize='none'>
        <EuiFlexItem>
          <EuiLink
            href={getCore().application.getUrlForApp('fleet-management', {
              path: `#/fleet-management/groups/${data.id}`,
            })}
          >
            {field}
          </EuiLink>
        </EuiFlexItem>
      </EuiFlexGroup>
    ),
  },
  {
    field: 'agents',
    name: 'Agents',
    sortable: true,
    show: true,
    searchable: true,
  },
  {
    field: 'actions',
    name: 'Actions',
    show: true,
    actions: tableActions({ setIsFlyoutVisible, setGroup }),
  },
];
