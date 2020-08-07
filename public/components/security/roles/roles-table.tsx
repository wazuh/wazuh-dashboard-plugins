
import React, { useState, useEffect } from 'react';
import {
    EuiInMemoryTable,
    EuiBadge,
    EuiFlexGroup,
    EuiFlexItem,
    EuiToolTip,
    EuiSpacer,
    EuiLoadingSpinner
} from '@elastic/eui';
import { ApiRequest } from '../../../react-services/api-request';

export const RolesTable = () => {
    const [roles, setRoles] = useState('');
    const [policiesData, setPolicies] = useState('');
    const [loading, setLoading] = useState(false);
    async function getData() {
        setLoading(true);
        const roles_request = await ApiRequest.request(
            'GET',
            '/security/roles',
            {}
        );
        const roles = (((roles_request || {}).data || {}).data || {}).affected_items || [];
        setRoles(roles);
        const uniquePolicies = new Set(roles.map(x => x.policies).reduce((a, b) => [...a, ...b], []));
        const policies_request = await ApiRequest.request(
            'GET',
            '/security/policies',
            { 'policy_ids': Array.from(uniquePolicies) }
        );
        const policies = (((policies_request || {}).data || {}).data || {}).affected_items || [];
        setPolicies(policies);
        setLoading(false);
    }

    useEffect(() => {
        getData();
    }, []);

    const columns = [
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
            render: policies => {
                return policiesData && <EuiFlexGroup
                    wrap
                    responsive={false}
                    gutterSize="xs">
                    {policies.map(policy => {
                        const data = ((policiesData || []).find(x => x.id === policy) || {});
                        return data.name && <EuiFlexItem grow={false} key={policy}>
                            <EuiToolTip
                                position="top"
                                content={
                                    <div>
                                        <b>Actions</b>
                                        <p>{((data.policy || {}).actions || []).join(", ")}</p>
                                        <EuiSpacer size="s" />
                                        <b>Resources</b>
                                        <p>{(data.policy || {}).resources}</p>
                                        <EuiSpacer size="s" />
                                        <b>Effect</b>
                                        <p>{(data.policy || {}).effect}</p>
                                    </div>
                                }>
                                <EuiBadge color="hollow" onClick={() => { }}>{
                                    data.name
                                }</EuiBadge>
                            </EuiToolTip>
                        </EuiFlexItem>;
                    })}
                </EuiFlexGroup> ||
                    <EuiLoadingSpinner size="m" />
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