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
import { UI_LOGGER_LEVELS } from '../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../react-services/common-services';

export const UsersTable = ({ users, editUserFlyover, rolesLoading, roles, onSave }) => {
  const getRowProps = item => {
    const { id } = item;
    return {
      'data-test-subj': `row-${id}`,
      onClick: () => editUserFlyover(item),
    };
  };

  const onConfirmDeleteUser = (item) => {
    return async () => {
      try {
        await UsersServices.DeleteUsers([item.id]);
        ErrorHandler.info('User was successfully deleted');
        onSave();
      } catch (error) {
        const options = {
          context: `${UsersTable.name}.onConfirmDeleteUser`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          store: true,
          error: {
            error: error,
            message: error.message || error,
            title: error.name || error,
          },
        };
        getErrorOrchestrator().handleError(options);
      }
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
              content: WzAPIUtils.isReservedID(item.id) ? "Reserved users can't be deleted" : 'Delete user',
              position: 'left',
            }}
            isDisabled={WzAPIUtils.isReservedID(item.id)}
            modalTitle={`Do you want to delete ${item.username} user?`}
            onConfirm={onConfirmDeleteUser(item)}
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
