/*
 * Wazuh app - Table with search bar
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { useState, useEffect } from 'react';
import { EuiBasicTable, EuiSpacer } from '@elastic/eui';
import { WzSearchBar } from '../../wz-search-bar/'

export function TableWithSearchBar({
  onSearch,
  searchBarSuggestions,
  searchBarPlaceholder = 'Filter or search',
  searchBarProps = {},
  tableColumns,
  tablePageSizeOptions = [15, 25, 50, 100],
  tableInitialSortingDirection = 'asc',
  tableInitialSortingField = '',
  tableProps = {},
  reload
})
  {

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: tablePageSizeOptions[0]
  });

  const [sorting, setSorting] = useState({
    sort: {
      field: tableInitialSortingField,
      direction: tableInitialSortingDirection,
    }
  });
  
  function tableOnChange({ page = {}, sort = {} }){
    const { index: pageIndex, size: pageSize } = page;
    const { field, direction } = sort;
    setPagination({
      pageIndex,
      pageSize
    });
    setSorting({
      sort: {
        field,
        direction,
      },
    });
  };
  
  useEffect(() => {
    (async function(){
      try{
        setLoading(true);
        const { items, totalItems } = await onSearch(filters, pagination, sorting);
        setItems(items);
        setTotalItems(totalItems);
      }catch(error){
        setItems([]);
        setTotalItems(0);
      }
      setLoading(false);
    })()
  }, [filters, pagination, sorting, reload]);

  const tablePagination = {
    ...pagination,
    totalItemCount: totalItems,
    pageSizeOptions: tablePageSizeOptions
  }
  return <>
    <WzSearchBar
      noDeleteFiltersOnUpdateSuggests
      filters={filters}
      onFiltersChange={setFilters}
      suggestions={searchBarSuggestions}
      placeholder={searchBarPlaceholder}
      {...searchBarProps}
    />
    <EuiSpacer size='s'/>
    <EuiBasicTable
      columns={tableColumns}
      items={items}
      loading={loading}
      pagination={tablePagination}
      sorting={sorting}
      onChange={tableOnChange}
      {...tableProps}
    />
  </>
}
