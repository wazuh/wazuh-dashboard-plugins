import React, { useState, useEffect } from 'react';
import {
  EuiBasicTable,
  EuiBadge,
  EuiFlexGroup,
  EuiFlexItem,
  EuiToolTip,
  EuiSpacer,
  EuiLoadingSpinner,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { WzRequest } from '../../../react-services/wz-request';
import { ErrorHandler } from '../../../react-services/error-handler';
import { WzButtonPermissionsModalConfirm } from '../../common/buttons';
import { WzAPIUtils } from '../../../react-services/wz-api-utils';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../react-services/common-services';

export const RolesTable = ({
  roles,
  policiesData,
  loading,
  editRole,
  updateRoles,
  pageIndex,
  pageSize,
  totalItems,
  onTableChange,
  sorting,
}) => {
  const [rolesState, setRolesState] = useState([]);

  useEffect(() => {
    setRolesState(roles);
  }, [roles]);

  const getRowProps = item => {
    const { id } = item;
    return {
      'data-test-subj': `row-${id}`,
      onClick: () => editRole(item),
    };
  };

  const onConfirmDeleteRole = item => {
    return async () => {
      try {
        const response = await WzRequest.apiReq('DELETE', '/security/roles/', {
          params: {
            role_ids: item.id,
          },
        });
        const data = response?.data?.data;
        if (data?.failed_items && data?.failed_items?.length) {
          return;
        }
        // Workaround for tooltip problem does not disappear
        // when deleting a role if the following role is a reserved role
        setRolesState([]);
        ErrorHandler.info(
          i18n.translate('wazuh.security.rolesTable.deleteSuccess', {
            defaultMessage: 'Role was successfully deleted',
          }),
        );
        await updateRoles();
      } catch (error) {
        const options = {
          context: `${RolesTable.name}.onConfirmDeleteRole`,
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

  const columns = [
    {
      field: 'id',
      name: i18n.translate('wazuh.security.rolesTable.columns.id', {
        defaultMessage: 'ID',
      }),
      width: '75',
      sortable: true,
      truncateText: true,
    },
    {
      field: 'name',
      name: i18n.translate('wazuh.security.rolesTable.columns.name', {
        defaultMessage: 'Name',
      }),
      width: '200',
      sortable: true,
      truncateText: true,
    },
    {
      field: 'policies',
      name: i18n.translate('wazuh.security.rolesTable.columns.policies', {
        defaultMessage: 'Policies',
      }),
      render: policies => {
        return (
          (policiesData && (
            <EuiFlexGroup wrap responsive={false} gutterSize='xs'>
              {policies.map(policy => {
                const data =
                  (policiesData || []).find(x => x.id === policy) || {};
                return (
                  data.name && (
                    <EuiFlexItem grow={false} key={policy}>
                      <EuiToolTip
                        position='top'
                        content={
                          <div>
                            <b>
                              {i18n.translate(
                                'wazuh.security.rolesTable.policyTooltip.actions',
                                { defaultMessage: 'Actions' },
                              )}
                            </b>
                            <p>
                              {((data.policy || {}).actions || []).join(', ')}
                            </p>
                            <EuiSpacer size='s' />
                            <b>
                              {i18n.translate(
                                'wazuh.security.rolesTable.policyTooltip.resources',
                                { defaultMessage: 'Resources' },
                              )}
                            </b>
                            <p>
                              {((data.policy || {}).resources || []).join(', ')}
                            </p>
                            <EuiSpacer size='s' />
                            <b>
                              {i18n.translate(
                                'wazuh.security.rolesTable.policyTooltip.effect',
                                { defaultMessage: 'Effect' },
                              )}
                            </b>
                            <p>{(data.policy || {}).effect}</p>
                          </div>
                        }
                      >
                        <EuiBadge
                          color='hollow'
                          onClick={() => {}}
                          onClickAriaLabel={i18n.translate(
                            'wazuh.security.rolesTable.policyBadgeAriaLabel',
                            {
                              defaultMessage: '{policyName} policy',
                              values: { policyName: data.name },
                            },
                          )}
                          title={null}
                        >
                          {data.name}
                        </EuiBadge>
                      </EuiToolTip>
                    </EuiFlexItem>
                  )
                );
              })}
            </EuiFlexGroup>
          )) || <EuiLoadingSpinner size='m' />
        );
      },
    },
    {
      field: 'id',
      name: i18n.translate('wazuh.security.rolesTable.columns.status', {
        defaultMessage: 'Status',
      }),
      render: item => {
        return (
          WzAPIUtils.isReservedID(item) && (
            <EuiBadge color='primary'>
              {i18n.translate('wazuh.security.rolesTable.reservedBadge', {
                defaultMessage: 'Reserved',
              })}
            </EuiBadge>
          )
        );
      },
      width: '150',
      sortable: false,
    },
    {
      align: 'right',
      width: '70',
      name: i18n.translate('wazuh.security.rolesTable.columns.actions', {
        defaultMessage: 'Actions',
      }),
      render: item => (
        <div onClick={ev => ev.stopPropagation()}>
          <WzButtonPermissionsModalConfirm
            buttonType='icon'
            permissions={[
              { action: 'security:delete', resource: `role:id:${item.id}` },
            ]}
            tooltip={{
              content: WzAPIUtils.isReservedID(item.id)
                ? i18n.translate(
                    'wazuh.security.rolesTable.deleteReservedTooltip',
                    { defaultMessage: "Reserved roles can't be deleted" },
                  )
                : i18n.translate('wazuh.security.rolesTable.deleteTooltip', {
                    defaultMessage: 'Delete role',
                  }),
              position: 'left',
            }}
            isDisabled={WzAPIUtils.isReservedID(item.id)}
            modalTitle={i18n.translate(
              'wazuh.security.rolesTable.deleteModalTitle',
              {
                defaultMessage: 'Do you want to delete the {roleName} role?',
                values: { roleName: item.name },
              },
            )}
            onConfirm={onConfirmDeleteRole(item)}
            modalProps={{ buttonColor: 'danger' }}
            iconType='trash'
            color='danger'
            aria-label={i18n.translate(
              'wazuh.security.rolesTable.deleteAriaLabel',
              { defaultMessage: 'Delete role' },
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
      items={rolesState}
      columns={columns}
      pagination={pagination}
      onChange={onTableChange}
      rowProps={getRowProps}
      loading={loading}
      sorting={sorting}
    />
  );
};
