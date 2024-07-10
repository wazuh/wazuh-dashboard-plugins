import React from 'react';
import { tableActions } from "./actions/actions";
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiHealth,
  EuiToolTip,
  EuiText,
  EuiBadge,
  EuiLink,
} from '@elastic/eui';
import { getCore, getWazuhCore } from '../../../plugin-services';


export const columns = ({
  setIsFlyoutVisible,
  setGroup,
}: {
  setIsFlyoutVisible: (isVisible: boolean) => void;
  setGroup: (agent: Group) => void;
}) => [
    {
      field: 'id',
      name: 'ID',
      sortable: true,
      show: true,
      searchable: true,
      render: (field: string, data: Group) => (
        <EuiFlexGroup direction='column' gutterSize='none'>
          <EuiFlexItem>
            <EuiToolTip content={data.id}>
              <EuiText size="s">
                {`${data.id.substring(0, 22)}...`}
              </EuiText>
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
      render: (field: string, data: Agent) => (
        <EuiFlexGroup direction='column' gutterSize='none'>
          <EuiFlexItem>
            <EuiLink
              href={getCore().application.getUrlForApp('fleet-management', {
                path: `#/fleet-management/groups/${data.id}`,
              })}
            >
              {data.name}
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