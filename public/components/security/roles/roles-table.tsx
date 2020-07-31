
import React, { useState, useEffect } from 'react';
import {
    EuiInMemoryTable,
    EuiBadge
} from '@elastic/eui';
import { ApiRequest } from '../../../react-services/api-request'

export const RolesTable = () => {
    const [roles, setRoles] = useState('');
    const [loading, setLoading] = useState(false);
    async function getData() {
        setLoading(true);
        const request = await ApiRequest.request(
            'GET',
            '/security/roles',
            {}
        );
        setRoles((((request || {}).data || {}).data || {}).affected_items || []);
        setLoading(false);
    }

    useEffect(() => {
        getData();
    }, []);

    const columns = [
        {
            field: 'name',
            name: 'Name',
            sortable: true,
            truncateText: true,
        },
        {
            field: 'policies',
            name: 'Policies',
            render: policies => {
                return policies.map(policy => {
                    return <EuiBadge color="secondary">{policy}</EuiBadge>;
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
            items={roles}
            columns={columns}
            search={search}
            pagination={true}
            loading={loading}
            sorting={sorting}
        />
    );
};