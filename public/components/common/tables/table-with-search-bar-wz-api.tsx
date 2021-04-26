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

import React, { useCallback, useState } from 'react';
import {
  EuiTitle,
  EuiLoadingSpinner,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';
import { filtersToObject } from '../../wz-search-bar';
import { TableWithSearchBar } from './table-with-search-bar';
import { TableDeafult } from './table-default'
import { WzRequest } from '../../../react-services/wz-request';
import { ExportTableCsv }  from './components/export-table-csv';

export function TableWithSearchBarWzAPI({endpoint, ...rest}){

  const [results, setResults] = useState({items: {}, totalItems: 0});
  const [filters, setFilters] = useState([]);

  const onSearch = useCallback(async function(filters, pagination, sorting){
    try {
      const { pageIndex, pageSize } = pagination;
      const { field, direction } = sorting.sort;
      setFilters(filters)
      const params = {
        ...filtersToObject(filters),
        offset: pageIndex * pageSize,
        limit: pageSize,
        sort: `${direction === 'asc' ? '+' : '-'}${field}`
      };

      const response = await WzRequest.apiReq('GET', endpoint, { params });

      const { affected_items, total_affected_items } = ((response || {}).data || {}).data;
      const results = {items: affected_items, totalItems: total_affected_items}
      setResults(results)
      return results;
    } catch (error) {
      return Promise.reject(error);
    }
  },[]);

  const renderTableHeader = () => {
      return (
        <EuiFlexGroup>
          <EuiFlexItem>
            {rest.title ? <EuiTitle size="s">
              <h1>{rest.title}&nbsp; {rest.reload === true ? <EuiLoadingSpinner size="s" /> : <span>({ results.totalItems })</span>}</h1>
            </EuiTitle> : ''}
          </EuiFlexItem>
          {rest.downloadCsv ? <ExportTableCsv endpoint={endpoint} totalItems={results.totalItems} filters={filters} title={rest.title}/> : ''}
        </EuiFlexGroup>
      )
  }

  const renderTable = () => {
    return (
      rest.searchTable ?
      <TableWithSearchBar
        onSearch={onSearch}
        {...rest}
      /> :
      <TableDeafult
        onSearch={onSearch}
        {...rest}
      />
    )
  }

  const header = renderTableHeader();
  const table = renderTable();
  
  return <>
  {header}
  {table}
  </>
}

// Set default props
TableWithSearchBarWzAPI.defaultProps = {
  title: null,
  downloadCsv: false,
  searchBar: false,
  rowProps: false,
};