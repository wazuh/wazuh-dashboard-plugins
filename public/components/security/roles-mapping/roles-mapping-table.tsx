import React from 'react';
import {
  EuiInMemoryTable,
  EuiBadge,
  EuiToolTip,
  EuiButtonIcon,
  EuiFlexItem,
  EuiFlexGroup
} from '@elastic/eui';
import { WzRequest } from '../../../react-services/wz-request';
import { ErrorHandler } from '../../../react-services/error-handler';

export const RolesMappingTable = ({ rolesEquivalences, rules, loading, editRule, updateRules }) => {
  const getRowProps = item => {
    const { id } = item;
    return {
      'data-test-subj': `row-${id}`,
      onClick: () => editRule(item),
    };
  };

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
      sortable: true,
      truncateText: true,
    },
    {
      field: 'roles',
      name: 'Roles',
      sortable: true,
      render: (item) => {
        const tmpRoles = item.map(role => {
          return <EuiFlexItem grow={false}><EuiBadge color="secondary">{rolesEquivalences[role]}</EuiBadge></EuiFlexItem>;
        });
        return <EuiFlexGroup
          wrap
          responsive={false}
          gutterSize="xs">
          {tmpRoles}
        </EuiFlexGroup>
      },
      truncateText: true,
    },
    {
      field: 'id',
      name: 'Status',
      render: (item) => {
        return item < 3 && <EuiBadge color="primary" >Reserved</EuiBadge>
      },
      width: 150,
      sortable: false,
    },
    {
      align: 'right',
      width: '5%',
      name: 'Actions',
      render: item => {
        return <EuiToolTip
          content={item.id < 3 ? "Reserved policies can't be deleted" : 'Delete policy'}
          position="left">
          <EuiButtonIcon
            isDisabled={item.id < 3}
            onClick={async (ev) => {
              ev.stopPropagation();
              try {
                const response = await WzRequest.apiReq(
                  'DELETE',
                  `/security/rules/`,
                  {
                    params: {
                      rule_ids: item.id
                    }
                  }
                );
                const data = (response.data || {}).data;
                if (data.failed_items && data.failed_items.length) {
                  return;
                }
                ErrorHandler.info('Rule was successfully deleted');
                updateRules();
              } catch (err) {
                ErrorHandler.error(err);
              }
            }}
            iconType="trash"
            color={'danger'}
            aria-label="Delete policy"
          />
        </EuiToolTip>
      }
    }
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
      items={rules}
      columns={columns}
      search={search}
      rowProps={getRowProps}
      pagination={true}
      loading={loading}
      sorting={sorting}
    />
  );
};