import React, { useState, useEffect } from 'react';
import {
    EuiBasicTable,
    EuiButtonIcon,
    EuiDescriptionList,
} from '@elastic/eui';
import { RIGHT_ALIGNMENT } from '@elastic/eui/lib/services';
import { WzRequest } from '../../../react-services/wz-request';
import { ErrorHandler } from '../../../react-services/error-handler';



export const EditRolesTable = ({ policies, role, onChange, isDisabled, loading}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [itemIdToExpandedRowMap, setItemIdToExpandedRowMap] = useState({});

    const onTableChange = ({ page = {}, sort = {} }) => {
        const { index: pageIndex, size: pageSize } = page;
        setPageIndex(pageIndex);
        setPageSize(pageSize);
      };

      const formatPolicies = (policiesArray) => {
        return policiesArray.map(policy => {
          return policies.find(item => item.id === policy)
        })
      }

      const getItems = () => {
        if(loading) return { pageOfItems: [], totalItemCount: 0};
        const items = formatPolicies(role.policies.slice(pageIndex*pageSize, pageIndex*pageSize + pageSize));
        return { pageOfItems: items, totalItemCount: role.policies.length}
      }

      const { pageOfItems, totalItemCount } = getItems();
    
      const toggleDetails = item => {
        const itemIdToExpandedRowMapValues = { ...itemIdToExpandedRowMap };
        if (itemIdToExpandedRowMapValues[item.id]) {
          delete itemIdToExpandedRowMapValues[item.id];
        } else {
            
          const listItems = [
            {
              title: 'Actions',
              description: `${item.policy.actions}`,
            },
            {
              title: 'Resources',
              description: `${item.policy.resources}`,
            },
            {
              title: 'Effect',
              description: `${item.policy.effect}`,
            },
          ];
          itemIdToExpandedRowMapValues[item.id] = (
            <EuiDescriptionList listItems={listItems} />
          );
        }
        setItemIdToExpandedRowMap(itemIdToExpandedRowMapValues);
      };
      const columns = [
        {
          field: 'label',
          name: 'Policies',
          sortable: false,
          truncateText: true
        },
        {
          name: 'Actions',
          actions: [
            {
              name: 'Remove',
              description: 'Remove',
              type: 'icon',
              color: 'danger',
              icon: 'trash',
              enabled : () => !isDisabled && !isLoading,
              onClick: async(item) => {
                  try{
                    setIsLoading(true);
                    const response = await WzRequest.apiReq(
                        'DELETE',
                        `/security/roles/${role.id}/policies`,
                        {
                            params: {
                                policy_ids: item.id
                            }
                        }
                    );
                    const removePolicy = (response.data || {}).data;
                    if (removePolicy.failed_items && removePolicy.failed_items.length) {
                        setIsLoading(false);
                        return;
                    }
                    ErrorHandler.info(`Policy was successfully removed from role ${role.name}`);
                    await onChange();
                  }catch(err){ }
                  setIsLoading(false);
              },
            },
          ],
        },
        {
          align: RIGHT_ALIGNMENT,
          width: '40px',
          isExpander: true,
          render: item => (
            <EuiButtonIcon
              onClick={() => toggleDetails(item)}
              aria-label={itemIdToExpandedRowMap[item.id] ? 'Collapse' : 'Expand'}
              iconType={itemIdToExpandedRowMap[item.id] ? 'arrowUp' : 'arrowDown'}
            />
          ),
        },
    ];

  const pagination = {
    pageIndex: pageIndex,
    pageSize: pageSize,
    totalItemCount: totalItemCount,
    pageSizeOptions: [5, 10, 20],
  };

  return (
    <>
      <EuiBasicTable
        items={pageOfItems}
        itemId="id"
        loading={isLoading || loading}
        itemIdToExpandedRowMap={itemIdToExpandedRowMap}
        isExpandable={true}
        hasActions={true}
        columns={columns}
        pagination={pagination}
        isSelectable={true}
        onChange={onTableChange}
      />
    </>
  );
};
