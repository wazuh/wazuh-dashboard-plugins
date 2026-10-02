import React, { useState, useEffect } from 'react';
import {
  EuiBasicTable,
  EuiBadge,
  EuiFlexGroup,
  EuiLoadingSpinner,
  EuiFlexItem,
  EuiBasicTableColumn,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { WzButtonPermissionsModalConfirm } from '../../../common/buttons';
import UsersServices from '../services';
import { ErrorHandler } from '../../../../react-services/error-handler';
import { WzAPIUtils } from '../../../../react-services/wz-api-utils';
import { UI_LOGGER_LEVELS } from '../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../react-services/common-services';

export const UsersTable = ({
  users,
  editUserFlyover,
  rolesLoading,
  roles,
  loading,
  pageIndex,
  pageSize,
  totalItems,
  onTableChange,
  onSave,
  sorting,
}) => {
  const [userState, setUserState] = useState([]);
  const getRowProps = item => {
    const { id } = item;
    return {
      'data-test-subj': `row-${id}`,
      onClick: () => editUserFlyover(item),
    };
  };

  useEffect(() => {
    setUserState(users);
  }, [users]);

  const onConfirmDeleteUser = item => {
    return async () => {
      try {
        await UsersServices.DeleteUsers([item.id]);
        // Workaround for tooltip problem does not disappear
        // when deleting a user if the following user is a reserved user
        setUserState([]);
        ErrorHandler.info(
          i18n.translate('wazuh.security.usersTable.deleteSuccess', {
            defaultMessage: 'User was successfully deleted',
          }),
        );
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
      name: i18n.translate('wazuh.security.usersTable.columns.user', {
        defaultMessage: 'User',
      }),
      sortable: true,
      truncateText: true,
    },
    {
      field: 'allow_run_as',
      name: i18n.translate('wazuh.security.usersTable.columns.allowRunAs', {
        defaultMessage: 'Allow run as ',
      }),
      // Not sortable: the Server API only allows sorting /security/users by
      // `username` and `id`. Any other field is rejected with a bad request.
      truncateText: true,
    },
    {
      field: 'roles',
      name: i18n.translate('wazuh.security.usersTable.columns.roles', {
        defaultMessage: 'Roles',
      }),
      dataType: 'boolean',
      render: userRoles => {
        if (rolesLoading) {
          return <EuiLoadingSpinner size='m' />;
        }
        if (!userRoles || !userRoles.length) return <></>;
        const tmpRoles = userRoles.map((userRole, idx) => {
          return (
            <EuiFlexItem grow={false} key={idx}>
              <EuiBadge color='secondary'>{roles[userRole]}</EuiBadge>
            </EuiFlexItem>
          );
        });
        return (
          <EuiFlexGroup wrap responsive={false} gutterSize='xs'>
            {tmpRoles}
          </EuiFlexGroup>
        );
      },
    },
    {
      align: 'right',
      width: '70',
      name: i18n.translate('wazuh.security.usersTable.columns.actions', {
        defaultMessage: 'Actions',
      }),
      render: item => (
        <div onClick={ev => ev.stopPropagation()}>
          <WzButtonPermissionsModalConfirm
            buttonType='icon'
            permissions={[
              { action: 'security:delete', resource: `user:id:${item.id}` },
            ]}
            tooltip={{
              content: WzAPIUtils.isReservedID(item.id)
                ? i18n.translate(
                    'wazuh.security.usersTable.deleteReservedTooltip',
                    { defaultMessage: "Reserved users can't be deleted" },
                  )
                : i18n.translate('wazuh.security.usersTable.deleteTooltip', {
                    defaultMessage: 'Delete user',
                  }),
              position: 'left',
            }}
            isDisabled={WzAPIUtils.isReservedID(item.id)}
            modalTitle={i18n.translate(
              'wazuh.security.usersTable.deleteModalTitle',
              {
                defaultMessage: 'Do you want to delete {username} user?',
                values: { username: item.username },
              },
            )}
            onConfirm={onConfirmDeleteUser(item)}
            modalProps={{ buttonColor: 'danger' }}
            iconType='trash'
            color='danger'
            aria-label={i18n.translate(
              'wazuh.security.usersTable.deleteAriaLabel',
              { defaultMessage: 'Delete user' },
            )}
            modalCancelText={i18n.translate(
              'wazuh.security.usersTable.deleteModalCancel',
              { defaultMessage: 'Cancel' },
            )}
            modalConfirmText={i18n.translate(
              'wazuh.security.usersTable.deleteModalConfirm',
              { defaultMessage: 'Confirm' },
            )}
          />
        </div>
      ),
    },
  ];

  const pagination = {
    pageIndex,
    pageSize,
    totalItemCount: totalItems,
    pageSizeOptions: [5, 10, 25, 50],
    showPerPageOptions: true,
  };

  return (
    <EuiBasicTable
      items={userState}
      columns={columns}
      pagination={pagination}
      onChange={onTableChange}
      rowProps={getRowProps}
      loading={loading}
      sorting={sorting}
    />
  );
};
