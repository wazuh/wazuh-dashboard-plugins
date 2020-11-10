
import React from 'react';
import {
  EuiInMemoryTable,
  EuiBadge,
  EuiFlexGroup,
  EuiLoadingSpinner,
  EuiFlexItem,
  EuiBasicTableColumn,
  SortDirection
} from '@elastic/eui';
import { WzButtonModalConfirm } from '../../common/buttons';
import { WzRequest, ErrorHandler } from "../../../react-services";

export const UsersTable = ({ users, editUserFlyover, rolesLoading, roles, updateUsers }) => {
  const getRowProps = item => {
    const { id } = item;
    return {
      'data-test-subj': `row-${id}`,
      onClick: () => editUserFlyover(item),
    };
  };

  const columns: EuiBasicTableColumn<any>[] = [
    {
      field: 'username',
      name: 'User',
      sortable: true,
      truncateText: true,
    },
    {
      field: 'allow_run_as',
      name: 'Allow run as ',
      sortable: true,
      truncateText: true,
    },
    {
      field: 'roles',
      name: 'Roles',
      dataType: 'boolean',
      render: (userRoles) => {
        if (rolesLoading) {
          return <EuiLoadingSpinner size="m" />
        }
        if (!userRoles || !userRoles.length) return <></>;
        const tmpRoles = userRoles.map((userRole, idx) => {
          return <EuiFlexItem grow={false} key={idx}><EuiBadge color="secondary">{roles[userRole]}</EuiBadge></EuiFlexItem>;
        });
        return <EuiFlexGroup
          wrap
          responsive={false}
          gutterSize="xs">
          {tmpRoles}
        </EuiFlexGroup>
      },
      sortable: true,
    },
    {
      align: 'right',
      width: '5%',
      name: 'Actions',
      render: (item: {
        id: number,
        username: string,
        allow_run_as: boolean,
        roles: number[],
      }) => (
          <div onClick={ev => ev.stopPropagation()}>
            <WzButtonModalConfirm
              buttonType='icon'
              tooltip={{ content: [1, 2].includes(item.id) ? "Reserved users can't be deleted" : 'Delete user', position: 'left' }}
              isDisabled={[1, 2].includes(item.id)}
              modalTitle={`Do you want to delete the ${item.username} user?`}
              onConfirm={async () => {
                try {
                  const response = await WzRequest.apiReq(
                    'DELETE',
                    `/security/users/`,
                    {
                      params: {
                        user_ids: item.id
                      }
                    }
                  );
                  const data = (response.data || {}).data;
                  if (data.failed_items && data.failed_items.length) {
                    return;
                  }
                  ErrorHandler.info('User was successfully deleted');
                  updateUsers();
                } catch (error) { }
              }}
              modalProps={{ buttonColor: 'danger' }}
              iconType='trash'
              color='danger'
              aria-label='Delete User'
            />
          </div>
        )
    }
  ];

  const sorting = {
    sort: {
      field: 'roles',
      direction: SortDirection.DESC,
    },
  };

  const search = {
    box: {
      incremental: false,
      schema: true,
    },
  };

  return (
    <EuiInMemoryTable
      items={users}
      columns={columns}
      search={search}
      rowProps={getRowProps}
      pagination={true}
      sorting={sorting}
    />
  );
};