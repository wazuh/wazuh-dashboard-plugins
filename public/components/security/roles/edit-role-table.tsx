import React, { useState, useEffect } from 'react';
import {
    EuiBasicTable,
    EuiButtonIcon,
    EuiDescriptionList,
} from '@elastic/eui';
import { RIGHT_ALIGNMENT } from '@elastic/eui/lib/services';
import { WzRequest } from '../../../react-services/wz-request';
import { ErrorHandler } from '../../../react-services/error-handler';



export const EditRolesTable = ({ policies, role, onChange, isDisabled }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [sortField, setSortField] = useState('role');
    const [sortDirection, setSortDirection] = useState('asc');
    const [itemIdToExpandedRowMap, setItemIdToExpandedRowMap] = useState({});

    const onTableChange = ({ page = {}, sort = {} }) => {
        const { index: pageIndex, size: pageSize } = page;
    
        const { field: sortField, direction: sortDirection } = sort;
    
        setPageIndex(pageIndex);
        setPageSize(pageSize);
        setSortField(sortField);
        setSortDirection(sortDirection);
      };

      const getItems = () => {
          const items = policies.slice(pageIndex*pageSize, pageIndex*pageSize + pageSize);
          return { pageOfItems: items, totalItemCount: policies.length}
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
                    ErrorHandler.info(`Policy was successfull removed from role ${role.name}`);
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

  const sorting = {
    sort: {
      field: sortField,
      direction: sortDirection,
    },
  };
  return (
    <>
      <EuiBasicTable
        items={pageOfItems}
        itemId="id"
        loading={isLoading}
        itemIdToExpandedRowMap={itemIdToExpandedRowMap}
        isExpandable={true}
        hasActions={true}
        columns={columns}
        pagination={pagination}
        sorting={sorting}
        isSelectable={true}
        onChange={onTableChange}
      />
    </>
  );
};