import React, { useState, useEffect } from 'react';
import {
  EuiInMemoryTable,
  EuiBadge,
  EuiToolTip,
  EuiButtonIcon,
} from '@elastic/eui';
import { WzRequest } from '../../../react-services/wz-request';
import { ErrorHandler } from '../../../react-services/error-handler';
import { WzAPIUtils } from '../../../react-services/wz-api-utils';
import { WzButtonModalConfirm } from '../../common/buttons';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import { i18n } from '@kbn/i18n';



const policy1 = i18n.translate('wazuh.public.components.security.policies.table.policy', {
  defaultMessage: 'Do you want to delete the',
})
const policy2 = i18n.translate('wazuh.public.components.security.policies.table.policy2', {
  defaultMessage: 'policy?',
})
const deleted = i18n.translate('wazuh.public.components.security.policies.table.deleted', {
  defaultMessage: "Reserved policies can't be deleted",
})
const deletePolicy = i18n.translate('wazuh.public.components.security.policies.table.deletePolicy', {
  defaultMessage: 'Delete policy',
})
export const PoliciesTable = ({
  policies,
  loading,
  editPolicy,
  updatePolicies,
}) => {
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
        const data = (response.data || {}).data;
        if (data.failed_items && data.failed_items.length) {
          return;
        }
        ErrorHandler.info('Policy was successfully deleted');
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
      name: i18n.translate(
        'wazuh.public.components.security.policies.table.ID',
        {
          defaultMessage: 'ID',
        },
      ),
      width: 75,
      sortable: true,
      truncateText: true,
    },
    {
      field: 'name',
      name: i18n.translate(
        'wazuh.public.components.security.policies.table.Name',
        {
          defaultMessage: 'Name',
        },
      ),
      sortable: true,
      truncateText: true,
    },
    {
      field: 'policy.actions',
      name: i18n.translate(
        'wazuh.public.components.security.policies.table.Actions',
        {
          defaultMessage: 'Actions',
        },
      ),
      sortable: true,
      render: actions => {
        return (actions || []).join(', ');
      },
      truncateText: true,
    },
    {
      field: 'policy.resources',
      name: i18n.translate(
        'wazuh.public.components.security.policies.table.Resources',
        {
          defaultMessage: 'Resources',
        },
      ),
      sortable: true,
      truncateText: true,
    },
    {
      field: 'policy.effect',
      name: i18n.translate(
        'wazuh.public.components.security.policies.table.Effect',
        {
          defaultMessage: 'Effect',
        },
      ),
      sortable: true,
      truncateText: true,
    },
    {
      field: 'id',
      name: i18n.translate(
        'wazuh.public.components.security.policies.table.Status',
        {
          defaultMessage: 'Status',
        },
      ),
      render: item => {
        return (
          WzAPIUtils.isReservedID(item) && (
            <EuiBadge color='primary'>
              {i18n.translate(
                'wazuh.public.components.security.policies.table.Reserved',
                {
                  defaultMessage: 'Reserved',
                },
              )}
            </EuiBadge>
          )
        );
      },
      width: 150,
      sortable: false,
    },
    {
      align: 'right',
      width: '5%',
      name: i18n.translate(
        'wazuh.public.components.security.policies.table.Actions',
        {
          defaultMessage: 'Actions',
        },
      ),
      render: item => (
        <div onClick={ev => ev.stopPropagation()}>
          <WzButtonModalConfirm
            buttonType='icon'
            tooltip={{
              content: WzAPIUtils.isReservedID(item.id)
                ? deleted
                : deletePolicy,
              position: 'left',
            }}
            isDisabled={WzAPIUtils.isReservedID(item.id)}
            modalTitle={`${policy1} ${item.name} ${policy2}`}
            onConfirm={confirmDeletePolicy(item)}
            modalProps={{ buttonColor: 'danger' }}
            iconType='trash'
            color='danger'
            aria-label={i18n.translate(
              'wazuh.public.components.security.policies.table.delPolicy',
              {
                defaultMessage: 'Delete policy',
              },
            )}
          />
        </div>
      ),
    },
  ];

  const sorting = {
    sort: {
      field: 'id',
      direction: 'asc',
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
      items={policies}
      columns={columns}
      search={search}
      rowProps={getRowProps}
      pagination={true}
      loading={loading}
      sorting={sorting}
    />
  );
};
