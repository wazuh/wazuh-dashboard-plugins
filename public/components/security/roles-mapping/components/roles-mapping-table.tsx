import React from 'react';
import {
  EuiInMemoryTable,
  EuiBadge,
  EuiFlexItem,
  EuiFlexGroup,
  EuiBasicTableColumn,
  SortDirection,
} from '@elastic/eui';
import { ErrorHandler } from '../../../../react-services/error-handler';
import { WzButtonModalConfirm } from '../../../common/buttons';
import RulesServices from '../../rules/services';

export const RolesMappingTable = ({ rolesEquivalences, rules, loading, editRule, updateRules }) => {
  const getRowProps = item => {
    const { id } = item;
    return {
      'data-test-subj': `row-${id}`,
      onClick: () => editRule(item),
    };
  };

  const columns: EuiBasicTableColumn<any>[] = [
    {
      field: 'id',
      name: 'ID',
      width: '75',
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
      render: item => {
        const tmpRoles = item.map((role, idx) => {
          return (
            <EuiFlexItem key={`role_${idx}`} grow={false}>
              <EuiBadge color="secondary">{rolesEquivalences[role]}</EuiBadge>
            </EuiFlexItem>
          );
        });
        return (
          <EuiFlexGroup wrap responsive={false} gutterSize="xs">
            {tmpRoles}
          </EuiFlexGroup>
        );
      },
      truncateText: true,
    },
    {
      field: 'id',
      name: 'Status',
      render: item => {
        return item < 3 && <EuiBadge color="primary">Reserved</EuiBadge>;
      },
      width: '150',
      sortable: false,
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
              content:
                item.id < 3 ? "Reserved role mapping can't be deleted" : 'Delete role mapping',
              position: 'left',
            }}
            isDisabled={item.id < 3}
            modalTitle={`Do you want to delete the ${item.name} role mapping?`}
            onConfirm={async () => {
              try {
                await RulesServices.DeleteRules([item.id]);
                ErrorHandler.info('Role mapping was successfully deleted');
                updateRules();
              } catch (err) {
                ErrorHandler.error(err);
              }
            }}
            modalProps={{ buttonColor: 'danger' }}
            iconType="trash"
            color="danger"
            aria-label="Delete role mapping"
            modalCancelText="Cancel"
            modalConfirmText="Confirm"
          />
        </div>
      ),
    },
  ];

  const sorting = {
    sort: {
      field: 'id',
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
      items={rules || []}
      columns={columns}
      search={search}
      rowProps={getRowProps}
      pagination={true}
      loading={loading}
      sorting={sorting}
    />
  );
};
