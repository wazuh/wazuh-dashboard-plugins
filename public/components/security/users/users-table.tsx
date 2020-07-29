
import React from 'react';
import {
    EuiInMemoryTable,
    EuiBadge
} from '@elastic/eui';

export const UsersTable = () => {
    const users = [
        {
            id: '1',
            user: 'wazuh',
            roles: ['Admin']
        }
    ]
    const columns = [
        {
            field: 'user',
            name: 'User',
            sortable: true,
            truncateText: true,
        },
        {
            field: 'roles',
            name: 'Roles',
            dataType: 'boolean',
            render: roles => {
                return roles.map(role => {
                    return <EuiBadge color="secondary">{role}</EuiBadge>;
                });
            },
            sortable: true,
        },
    ];

    const sorting = {
        sort: {
            field: 'user',
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
            pagination={true}
            sorting={sorting}
        />
    );
};