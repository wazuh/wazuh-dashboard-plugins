
import React, { useState, useEffect } from 'react';
import {
    EuiInMemoryTable,
    EuiBadge
} from '@elastic/eui';
import { ApiRequest } from '../../../react-services/api-request';

export const PoliciesTable = ({policies, loading, editPolicy}) => {

    const getRowProps = item => {
        const { id } = item;
        return {
          'data-test-subj': `row-${id}`,
          onClick: () => editPolicy(item),
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
            field: 'policy.actions',
            name: 'Actions',
            sortable: true,
            render: actions => {
                return (actions || []).join(", ")
            },
            truncateText: true,
        },
        {
            field: 'policy.resources',
            name: 'Resources',
            sortable: true,
            truncateText: true,
        },
        {
            field: 'policy.effect',
            name: 'Effect',
            sortable: true,
            truncateText: true,
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
            items={policies}
            columns={columns}
            search={search}
            rowProps={getRowProps}
            pagination={true}
            loading={loading}
            sorting={sorting}
        />
    );
};