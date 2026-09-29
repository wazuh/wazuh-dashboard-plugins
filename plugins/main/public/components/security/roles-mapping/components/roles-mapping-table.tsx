import React, { useState, useEffect } from 'react';
import {
  EuiToolTip,
  EuiBasicTable,
  EuiBadge,
  EuiFlexItem,
  EuiFlexGroup,
  EuiBasicTableColumn,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { ErrorHandler } from '../../../../react-services/error-handler';
import { WzButtonPermissionsModalConfirm } from '../../../common/buttons';
import { WzAPIUtils } from '../../../../react-services/wz-api-utils';
import RulesServices from '../../rules/services';
import {
  UI_LOGGER_LEVELS,
  WAZUH_API_RESERVED_WUI_SECURITY_RULES,
} from '../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../react-services/common-services';

export const RolesMappingTable = ({
  rolesEquivalences,
  rules,
  loading,
  editRule,
  updateRules,
  pageIndex,
  pageSize,
  totalItems,
  onTableChange,
  sorting,
}) => {
  const [rulesState, setRulesState] = useState([]);

  useEffect(() => {
    setRulesState(rules);
  }, [rules]);

  const getRowProps = item => {
    const { id } = item;
    return {
      'data-test-subj': `row-${id}`,
      onClick: () => editRule(item),
    };
  };

  const onDeleteRoleMapping = item => {
    return async () => {
      try {
        await RulesServices.DeleteRules([item.id]);
        ErrorHandler.info(
          i18n.translate('wazuh.security.rolesMappingTable.deleteSuccess', {
            defaultMessage: 'Role mapping was successfully deleted',
          }),
        );
        updateRules();
        // Workaround for tooltip problem does not disappear
        // when deleting a rule if the following rule is a reserved rule
        setRulesState([]);
      } catch (error) {
        const options = {
          context: `${RolesMappingTable.name}.onDeleteRoleMapping`,
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
      field: 'id',
      name: i18n.translate('wazuh.security.rolesMappingTable.columns.id', {
        defaultMessage: 'ID',
      }),
      width: '75',
      sortable: true,
      truncateText: true,
    },
    {
      field: 'name',
      name: i18n.translate('wazuh.security.rolesMappingTable.columns.name', {
        defaultMessage: 'Name',
      }),
      sortable: true,
      truncateText: true,
    },
    {
      field: 'roles',
      name: i18n.translate('wazuh.security.rolesMappingTable.columns.roles', {
        defaultMessage: 'Roles',
      }),
      render: item => {
        const tmpRoles = item.map((role, idx) => {
          return (
            <EuiFlexItem key={`role_${idx}`} grow={false}>
              <EuiBadge color='secondary'>{rolesEquivalences[role]}</EuiBadge>
            </EuiFlexItem>
          );
        });
        return (
          <EuiFlexGroup wrap responsive={false} gutterSize='xs'>
            {tmpRoles}
          </EuiFlexGroup>
        );
      },
      truncateText: true,
    },
    {
      field: 'id',
      name: i18n.translate('wazuh.security.rolesMappingTable.columns.status', {
        defaultMessage: 'Status',
      }),
      render(item, obj) {
        if (WzAPIUtils.isReservedID(item)) {
          if (WAZUH_API_RESERVED_WUI_SECURITY_RULES.includes(obj.id)) {
            return (
              <EuiFlexGroup>
                <EuiBadge color='primary'>
                  {i18n.translate(
                    'wazuh.security.rolesMappingTable.reservedBadge',
                    { defaultMessage: 'Reserved' },
                  )}
                </EuiBadge>
                <EuiToolTip
                  position='top'
                  content={i18n.translate(
                    'wazuh.security.rolesMappingTable.wuiRulesTooltip',
                    {
                      defaultMessage: 'wui_ rules belong to wazuh-wui API user',
                    },
                  )}
                >
                  <EuiBadge color='accent' title='' style={{ marginLeft: 10 }}>
                    wazuh-wui
                  </EuiBadge>
                </EuiToolTip>
              </EuiFlexGroup>
            );
          }
          return (
            <EuiBadge color='primary'>
              {i18n.translate(
                'wazuh.security.rolesMappingTable.reservedBadge',
                {
                  defaultMessage: 'Reserved',
                },
              )}
            </EuiBadge>
          );
        }
      },
      width: '300',
      sortable: false,
    },
    {
      align: 'right',
      width: '70',
      name: i18n.translate('wazuh.security.rolesMappingTable.columns.actions', {
        defaultMessage: 'Actions',
      }),
      render: item => (
        <div onClick={ev => ev.stopPropagation()}>
          <WzButtonPermissionsModalConfirm
            buttonType='icon'
            permissions={[
              { action: 'security:delete', resource: `rule:id:${item.id}` },
            ]}
            tooltip={{
              content: WzAPIUtils.isReservedID(item.id)
                ? i18n.translate(
                    'wazuh.security.rolesMappingTable.deleteReservedTooltip',
                    {
                      defaultMessage: "Reserved role mapping can't be deleted",
                    },
                  )
                : i18n.translate(
                    'wazuh.security.rolesMappingTable.deleteTooltip',
                    { defaultMessage: 'Delete role mapping' },
                  ),
              position: 'left',
            }}
            isDisabled={WzAPIUtils.isReservedID(item.id)}
            modalTitle={i18n.translate(
              'wazuh.security.rolesMappingTable.deleteModalTitle',
              {
                defaultMessage:
                  'Do you want to delete the {roleMappingName} role mapping?',
                values: { roleMappingName: item.name },
              },
            )}
            onConfirm={onDeleteRoleMapping(item)}
            modalProps={{ buttonColor: 'danger' }}
            iconType='trash'
            color='danger'
            aria-label={i18n.translate(
              'wazuh.security.rolesMappingTable.deleteAriaLabel',
              { defaultMessage: 'Delete role mapping' },
            )}
            modalCancelText={i18n.translate(
              'wazuh.security.rolesMappingTable.deleteModalCancel',
              { defaultMessage: 'Cancel' },
            )}
            modalConfirmText={i18n.translate(
              'wazuh.security.rolesMappingTable.deleteModalConfirm',
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
      items={rulesState || []}
      columns={columns}
      pagination={pagination}
      onChange={onTableChange}
      rowProps={getRowProps}
      loading={loading}
      sorting={sorting}
    />
  );
};
