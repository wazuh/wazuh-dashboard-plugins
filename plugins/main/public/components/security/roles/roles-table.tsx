import React, { useState, useEffect } from 'react';
import {
  EuiInMemoryTable,
  EuiBadge,
  EuiFlexGroup,
  EuiFlexItem,
  EuiToolTip,
  EuiButtonIcon,
  EuiSpacer,
  EuiLoadingSpinner,
} from '@elastic/eui';
import { WzRequest } from '../../../react-services/wz-request';
import { ErrorHandler } from '../../../react-services/error-handler';
import { WzButtonModalConfirm } from '../../common/buttons';
import { WzAPIUtils } from '../../../react-services/wz-api-utils';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../react-services/common-services';

export const RolesTable = ({ roles, policiesData, loading, editRole, updateRoles }) => {
  const getRowProps = (item) => {
    const { id } = item;
    return {
      'data-test-subj': `row-${id}`,
      onClick: () => editRole(item),
    };
  };

  const onConfirmDeleteRole = (item) => {
    return async () => {
      try {
        const response = await WzRequest.apiReq('DELETE', `/security/roles/`, {
          params: {
            role_ids: item.id,
          },
        });
        const data = (response.data || {}).data;
        if (data.failed_items && data.failed_items.length) {
          return;
        }
        ErrorHandler.info('Role was successfully deleted');
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
  }

  const columns = [
    {
      field: 'id',
      name: 'ID',
      width: 75,
      sortable: true,
      truncateText: true,
    },
    {
      field: 'name',
      name: 'Name',
      width: 200,
      sortable: true,
      truncateText: true,
    },
    {
      field: 'policies',
      name: 'Policies',
      render: (policies) => {
        return (
          (policiesData && (
            <EuiFlexGroup wrap responsive={false} gutterSize="xs">
              {policies.map((policy) => {
                const data = (policiesData || []).find((x) => x.id === policy) || {};
                return (
                  data.name && (
                    <EuiFlexItem grow={false} key={policy}>
                      <EuiToolTip
                        position="top"
                        content={
                          <div>
                            <b>Actions</b>
                            <p>{((data.policy || {}).actions || []).join(', ')}</p>
                            <EuiSpacer size="s" />
                            <b>Resources</b>
                            <p>{((data.policy || {}).resources || []).join(', ')}</p>
                            <EuiSpacer size="s" />
                            <b>Effect</b>
                            <p>{(data.policy || {}).effect}</p>
                          </div>
                        }
                      >
                        <EuiBadge
                          color="hollow"
                          onClick={() => {}}
                          onClickAriaLabel={`${data.name} policy`}
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
          )) || <EuiLoadingSpinner size="m" />
        );
      },
      sortable: true,
    },
    {
      field: 'id',
      name: 'Status',
      render: (item) => {
        return WzAPIUtils.isReservedID(item) && <EuiBadge color="primary">Reserved</EuiBadge>;
      },
      width: 150,
      sortable: false,
    },
    {
      align: 'right',
      width: '5%',
      name: 'Actions',
      render: (item) => (
        <div onClick={(ev) => ev.stopPropagation()}>
          <WzButtonModalConfirm
            buttonType="icon"
            tooltip={{
              content: WzAPIUtils.isReservedID(item.id)
                ? "Reserved roles can't be deleted"
                : 'Delete role',
              position: 'left',
            }}
            isDisabled={WzAPIUtils.isReservedID(item.id)}
            modalTitle={`Do you want to delete the ${item.name} role?`}
            onConfirm={onConfirmDeleteRole(item)}
            modalProps={{ buttonColor: 'danger' }}
            iconType="trash"
            color="danger"
            aria-label="Delete role"
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
      items={roles}
      columns={columns}
      search={search}
      pagination={true}
      rowProps={getRowProps}
      loading={loading}
      sorting={sorting}
    />
  );
};
