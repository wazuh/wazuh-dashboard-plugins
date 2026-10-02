import React, { useState, useEffect } from 'react';
import { EuiBasicTable, EuiBadge } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { WzRequest } from '../../../react-services/wz-request';
import { ErrorHandler } from '../../../react-services/error-handler';
import { WzAPIUtils } from '../../../react-services/wz-api-utils';
import { WzButtonPermissionsModalConfirm } from '../../common/buttons';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../react-services/common-services';

export const PoliciesTable = ({
  policies,
  loading,
  editPolicy,
  updatePolicies,
  pageIndex,
  pageSize,
  totalItems,
  onTableChange,
  sorting,
}) => {
  const [policiesState, setPoliciesState] = useState([]);

  useEffect(() => {
    setPoliciesState(policies);
  }, [policies]);

  const getRowProps = item => {
    const { id } = item;
    return {
      'data-test-subj': `row-${id}`,
      onClick: () => {
        editPolicy(item);
      },
    };
  };

  const confirmDeletePolicy = item => {
    return async () => {
      try {
        const response = await WzRequest.apiReq(
          'DELETE',
          `/security/policies/`,
          {
            params: {
              policy_ids: item.id,
            },
          },
        );
        const data = response?.data?.data;
        if (data?.failed_items && data?.failed_items?.length) {
          return;
        }
        // Workaround for tooltip problem does not disappear
        // when deleting a policy if the following policy is a reserved policy
        setPoliciesState([]);
        ErrorHandler.info(
          i18n.translate('wazuh.security.policiesTable.deleteSuccess', {
            defaultMessage: 'Policy was successfully deleted',
          }),
        );
        await updatePolicies();
      } catch (error) {
        const options = {
          context: `${PoliciesTable.name}.confirmDeletePolicy`,
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
      name: i18n.translate('wazuh.security.policiesTable.columns.id', {
        defaultMessage: 'ID',
      }),
      width: '75',
      sortable: true,
      truncateText: true,
    },
    {
      field: 'name',
      name: i18n.translate('wazuh.security.policiesTable.columns.name', {
        defaultMessage: 'Name',
      }),
      sortable: true,
      truncateText: true,
    },
    {
      field: 'policy.actions',
      name: i18n.translate('wazuh.security.policiesTable.columns.actions', {
        defaultMessage: 'Actions',
      }),
      render: actions => {
        return (actions || []).sort((a, b) => a.localeCompare(b)).join(', ');
      },
      truncateText: true,
    },
    {
      field: 'policy.resources',
      name: i18n.translate('wazuh.security.policiesTable.columns.resources', {
        defaultMessage: 'Resources',
      }),
      truncateText: true,
    },
    {
      field: 'policy.effect',
      name: i18n.translate('wazuh.security.policiesTable.columns.effect', {
        defaultMessage: 'Effect',
      }),
      truncateText: true,
    },
    {
      field: 'id',
      name: i18n.translate('wazuh.security.policiesTable.columns.status', {
        defaultMessage: 'Status',
      }),
      render: item => {
        return (
          WzAPIUtils.isReservedID(item) && (
            <EuiBadge color='primary'>
              {i18n.translate('wazuh.security.policiesTable.reservedBadge', {
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
      name: i18n.translate('wazuh.security.policiesTable.columns.rowActions', {
        defaultMessage: 'Actions',
      }),
      render: item => (
        <div onClick={ev => ev.stopPropagation()}>
          <WzButtonPermissionsModalConfirm
            buttonType='icon'
            permissions={[
              { action: 'security:delete', resource: `policy:id:${item.id}` },
            ]}
            tooltip={{
              content: WzAPIUtils.isReservedID(item.id)
                ? i18n.translate(
                    'wazuh.security.policiesTable.deleteReservedTooltip',
                    { defaultMessage: "Reserved policies can't be deleted" },
                  )
                : i18n.translate('wazuh.security.policiesTable.deleteTooltip', {
                    defaultMessage: 'Delete policy',
                  }),
              position: 'left',
            }}
            isDisabled={WzAPIUtils.isReservedID(item.id)}
            modalTitle={i18n.translate(
              'wazuh.security.policiesTable.deleteModalTitle',
              {
                defaultMessage:
                  'Do you want to delete the {policyName} policy?',
                values: { policyName: item.name },
              },
            )}
            onConfirm={confirmDeletePolicy(item)}
            modalProps={{ buttonColor: 'danger' }}
            iconType='trash'
            color='danger'
            aria-label={i18n.translate(
              'wazuh.security.policiesTable.deleteAriaLabel',
              { defaultMessage: 'Delete policy' },
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
      items={policiesState}
      columns={columns}
      pagination={pagination}
      onChange={onTableChange}
      rowProps={getRowProps}
      loading={loading}
      sorting={sorting}
    />
  );
};
