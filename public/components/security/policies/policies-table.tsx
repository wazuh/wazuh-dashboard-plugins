
import React, { useState, useEffect } from 'react';
import {
    EuiInMemoryTable,
    EuiBadge,
    EuiToolTip,
    EuiButtonIcon
} from '@elastic/eui';
import { WzRequest } from '../../../react-services/wz-request';
import { ErrorHandler } from '../../../react-services/error-handler';

export const PoliciesTable = ({policies, loading, editPolicy, updatePolicies}) => {

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
        {
            field: 'id',
            name: 'Status',
            render: (item) => {
                return item < 27 && <EuiBadge color="primary" >Reserved</EuiBadge>
            },
            width: 150,
            sortable: false,
        },
        {
          align: 'right',
          width: '5%',
          name: 'Actions',
          render: item => {return <EuiToolTip
            content={item.id < 27 ? "Reserved policies can't be deleted" : 'Delete policy'}
            position="left">
            <EuiButtonIcon
              isDisabled={item.id < 27}
              onClick={async(ev) => {
                    ev.stopPropagation();
                    try{
                        const response = await WzRequest.apiReq(
                        'DELETE',
                        `/security/policies/`,
                        {
                            params: {
                                policy_ids: item.id
                            }
                        }
                    );                    
                    const data = (response.data || {}).data;
                    if (data.failed_items && data.failed_items.length){
                        return;
                    }
                    ErrorHandler.info('Policy was successfully deleted');
                    await updatePolicies();
                }catch(error){}
              }}
              iconType="trash"
              color={'danger'}
              aria-label="Delete policy"
            />
          </EuiToolTip>}
        }
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