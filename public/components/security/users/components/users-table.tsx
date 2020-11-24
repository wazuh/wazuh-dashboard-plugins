import React from 'react';
import {
  EuiInMemoryTable,
  EuiBadge,
  EuiFlexGroup,
  EuiLoadingSpinner,
  EuiFlexItem,
  EuiBasicTableColumn,
  SortDirection,
} from '@elastic/eui';
import { WzButtonModalConfirm } from '../../../common/buttons';
import UsersServices from '../services';
import { ErrorHandler } from '../../../../react-services/error-handler';
import { WzAPIUtils } from '../../../../react-services/wz-api-utils';

export const UsersTable = ({ users, editUserFlyover, rolesLoading, roles, onSave }) => {
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
      render: userRoles => {
        if (rolesLoading) {
          return <EuiLoadingSpinner size="m" />;
        }
        if (!userRoles || !userRoles.length) return <></>;
        const tmpRoles = userRoles.map((userRole, idx) => {
          return (
            <EuiFlexItem grow={false} key={idx}>
              <EuiBadge color="secondary">{roles[userRole]}</EuiBadge>
            </EuiFlexItem>
          );
        });
        return (
          <EuiFlexGroup wrap responsive={false} gutterSize="xs">
            {tmpRoles}
          </EuiFlexGroup>
        );
      },
      sortable: true,
    },
    {
      align: 'right',
      width: '5%',
      name: 'Actions',
      render: item => (
        <div onClick={ev => ev.stopPropagation()}>
          <WzButtonModalConfirm
            buttonType="icon"
            tooltip={{
              content: WzAPIUtils.isReservedID(item.id) ? "Reserved users mapping can't be deleted" : 'Delete user',
              position: 'left',
            }}
            isDisabled={WzAPIUtils.isReservedID(item.id)}
            modalTitle={`Do you want to delete ${item.username} user?`}
            onConfirm={async () => {
              try {
                await UsersServices.DeleteUsers([item.id]);
                ErrorHandler.info('User was successfully deleted');
                onSave();
              } catch (err) {
                ErrorHandler.error(err);
              }
            }}
            modalProps={{ buttonColor: 'danger' }}
            iconType="trash"
            color="danger"
            aria-label="Delete user"
            modalCancelText="Cancel"
            modalConfirmText="Confirm"
          />
        </div>
      ),
    },
  ];

  const sorting = {
    sort: {
      field: 'username',
      direction: SortDirection.ASC,
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
