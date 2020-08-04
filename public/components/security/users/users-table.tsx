
import React, { useState, useEffect } from 'react';
import {
    EuiInMemoryTable,
    EuiBadge,
    EuiFlexGroup,
    EuiFlexItem
} from '@elastic/eui';

export const UsersTable = ({ users, editUserFlyover}) => {
    
    const getRowProps = item => {
        const { id } = item;
        return {
          'data-test-subj': `row-${id}`,
          onClick: () => editUserFlyover(item),
        };
      };
    
    const columns = [
        {
            field: 'user',
            name: 'User',
            sortable: true,
            truncateText: true,
        },
        {
            field: 'full_name',
            name: 'Full name',
            sortable: true,
            truncateText: true,
        },
        {
            field: 'email',
            name: 'Email',
            sortable: true,
            truncateText: true,
        },
        {
            field: 'roles',
            name: 'Roles',
            dataType: 'boolean',
            render: roles => {
                const tmpRoles = roles.map(role => {
                    return <EuiFlexItem grow={false}><EuiBadge color="secondary">{role}</EuiBadge></EuiFlexItem>;
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
            direction: 'desc',
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