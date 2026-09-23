import React, { useState } from 'react';
import { EuiBasicTable, EuiButtonIcon, EuiDescriptionList } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { RIGHT_ALIGNMENT } from '@elastic/eui/lib/services';
import { WzRequest } from '../../../react-services/wz-request';
import { ErrorHandler } from '../../../react-services/error-handler';
import { WzButtonPermissions } from '../../common/permissions/button';
import { TableBasicManageExpandedItems } from '../../common/tables';
import { withErrorBoundary } from '../../common/hocs';

const ExpandedTableRow = withErrorBoundary(({ item }) => {
  const listItems = [
    {
      title: i18n.translate(
        'wazuh.security.editRoleTable.policyDetails.actions',
        { defaultMessage: 'Actions' },
      ),
      description: `${item.policy.actions}`,
    },
    {
      title: i18n.translate(
        'wazuh.security.editRoleTable.policyDetails.resources',
        { defaultMessage: 'Resources' },
      ),
      description: `${item.policy.resources}`,
    },
    {
      title: i18n.translate(
        'wazuh.security.editRoleTable.policyDetails.effect',
        { defaultMessage: 'Effect' },
      ),
      description: `${item.policy.effect}`,
    },
  ];
  return <EuiDescriptionList listItems={listItems} />;
});

export const EditRolesTable = ({
  policies,
  role,
  onChange,
  isDisabled,
  loading,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const onTableChange = ({ page = {}, sort = {} }) => {
    const { index: pageIndex, size: pageSize } = page;
    setPageIndex(pageIndex);
    setPageSize(pageSize);
  };

  const formatPolicies = policiesArray => {
    return policiesArray.map(policy => {
      return policies.find(item => item.id === policy);
    });
  };

  const getItems = () => {
    if (loading) return { pageOfItems: [], totalItemCount: 0 };
    const items = formatPolicies(
      role.policies.slice(
        pageIndex * pageSize,
        pageIndex * pageSize + pageSize,
      ),
    );
    return { pageOfItems: items, totalItemCount: role.policies.length };
  };

  const { pageOfItems, totalItemCount } = getItems();

  const columns = [
    {
      field: 'label',
      name: i18n.translate('wazuh.security.editRoleTable.columns.policies', {
        defaultMessage: 'Policies',
      }),
      sortable: false,
      truncateText: true,
    },
    {
      name: i18n.translate('wazuh.security.editRoleTable.columns.actions', {
        defaultMessage: 'Actions',
      }),
      actions: [
        {
          render: item => (
            <WzButtonPermissions
              buttonType='icon'
              permissions={[
                { action: 'security:delete', resource: `role:id:${role.id}` },
              ]}
              iconType='trash'
              color='danger'
              isDisabled={isDisabled && !isLoading}
              onClick={async ev => {
                try {
                  setIsLoading(true);
                  const response = await WzRequest.apiReq(
                    'DELETE',
                    `/security/roles/${role.id}/policies`,
                    {
                      params: {
                        policy_ids: item.id,
                      },
                    },
                  );
                  const removePolicy = response?.data?.data;
                  if (
                    removePolicy?.failed_items &&
                    removePolicy?.failed_items?.length
                  ) {
                    setIsLoading(false);
                    return;
                  }
                  ErrorHandler.info(
                    i18n.translate(
                      'wazuh.security.editRoleTable.removePolicySuccess',
                      {
                        defaultMessage:
                          'Policy was successfully removed from role {roleName}',
                        values: { roleName: role.name },
                      },
                    ),
                  );
                  await onChange();
                } catch (err) {}
                setIsLoading(false);
              }}
            />
          ),
        },
      ],
    },
  ];

  const pagination = {
    pageIndex: pageIndex,
    pageSize: pageSize,
    totalItemCount: totalItemCount,
    pageSizeOptions: [5, 10, 20],
  };

  return (
    <>
      <TableBasicManageExpandedItems
        items={pageOfItems}
        itemId='id'
        ExpandableRowContent={ExpandedTableRow}
        loading={isLoading || loading}
        hasActions={true}
        columns={columns}
        pagination={pagination}
        isSelectable={true}
        onChange={onTableChange}
      />
    </>
  );
};
