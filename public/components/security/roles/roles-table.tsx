
import React, { useState, useEffect } from 'react';
import {
    EuiInMemoryTable,
    EuiBadge,
    EuiFlexGroup,
    EuiFlexItem,
    EuiToolTip,
    EuiButtonIcon,
    EuiSpacer,
    EuiLoadingSpinner
} from '@elastic/eui';
import { ApiRequest } from '../../../react-services/api-request';
import { ErrorHandler } from '../../../react-services/error-handler';


export const RolesTable = ({roles, policiesData, loading, editRole, updateRoles}) => {
   
    const getRowProps = item => {
        const { id } = item;
        return {
          'data-test-subj': `row-${id}`,
          onClick: () => editRole(item),
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
                return item.id < 8 && <EuiBadge color="primary" >Reserved</EuiBadge>
            },
            width: 150,
            sortable: false,
        },
        {
          align: 'right',
          width: '5%',
          name: 'Actions',
          render: item => {return <EuiToolTip
            content={item.id < 8 ? "Reserved roles can't be deleted" : 'Delete role'}
            position="left">
            <EuiButtonIcon
              isDisabled={item.id < 8}
              onClick={async(ev) => {
                    ev.stopPropagation();
                    try{
                        const response = await ApiRequest.request(
                        'DELETE',
                        `/security/roles/`,
                        {
                            params: {
                                role_ids: item.id
                            }
                        }
                    );                    
                    const data = (response.data || {}).data;
                    if (data.failed_items && data.failed_items.length){
                        return;
                    }
                    ErrorHandler.info('Role was successfully deleted');
                    await updateRoles();
                }catch(error){}
              }}
              iconType="trash"
              color={'danger'}
              aria-label="Delete role"
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