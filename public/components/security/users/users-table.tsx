
import React from 'react';
import {
    EuiInMemoryTable,
    EuiBadge,
    EuiFlexGroup,
    EuiLoadingSpinner,
    EuiFlexItem,
    EuiBasicTableColumn,
    SortDirection
} from '@elastic/eui';

export const UsersTable = ({ users, editUserFlyover, rolesLoading, roles}) => {
    const getRowProps = item => {
        const { id } = item;
        return {
          'data-test-subj': `row-${id}`,
          onClick: () => editUserFlyover(item),
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
            render: (userRoles) => {
                if(rolesLoading){
                    return <EuiLoadingSpinner size="m" />
                }
                if(!userRoles || !userRoles.length) return <></>;
                const tmpRoles = userRoles.map((userRole, idx) => {
                    return <EuiFlexItem grow={false} key={idx}><EuiBadge color="secondary">{roles[userRole]}</EuiBadge></EuiFlexItem>;
                });
                return <EuiFlexGroup                    
                    wrap
                    responsive={false}
                    gutterSize="xs">
                    {tmpRoles}
                </EuiFlexGroup>
            },
            sortable: true,
        },
    ];

    const sorting = {
        sort: {
            field: 'roles',
            direction: SortDirection.DESC,
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