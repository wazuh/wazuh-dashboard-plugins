
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
const isReserved = {administrator : true, 'readonly' : true, 'users_admin' : true, 'agents_readonly' : true, 'agents_admin' : true, 'cluster_readonly' : true, 'cluster_admin' : true};

export const RolesTable = ({roles,policiesData, loading, editRole}) => {
   
    const getRowProps = item => {
        const { id } = item;
        return {
          'data-test-subj': `row-${id}`,
          onClick: () => editRole(item),
        };
      };

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
                                <EuiBadge color="hollow" onClick={() => {}} onClickAriaLabel={`${data.name} policy`} title={null}>{
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
        {
            field: 'name',
            name: 'Status',
            render: (item) => {
                return isReserved[item] && <EuiBadge color="primary" >Default role</EuiBadge>
            },
            width: 150,
            sortable: false,
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
            rowProps={getRowProps}
            loading={loading}
            sorting={sorting}
        />
    );
};