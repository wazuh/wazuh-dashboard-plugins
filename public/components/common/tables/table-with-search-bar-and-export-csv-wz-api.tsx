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
  EuiButtonEmpty
} from '@elastic/eui';
import { filtersToObject } from '../../wz-search-bar/';
import { TableWithSearchBar } from './table-with-search-bar';
import { WzRequest } from '../../../react-services/wz-request';
import exportCsv from '../../../react-services/wz-csv';
import { getToasts }  from '../../../kibana-services';

export function TableWithSearchBarAndCsvWzAPI({endpoint, ...rest}){

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

  const renderTitle = () => {
      return (
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiTitle size="s">
              <h1>{rest.title}&nbsp; {rest.reload === true ? <EuiLoadingSpinner size="s" /> : <span>({ results.totalItems })</span>}</h1>
            </EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty isDisabled={(results.totalItems == 0)} iconType="importAction" onClick={() => downloadCsv()}>
              Export formatted
            </EuiButtonEmpty>
          </EuiFlexItem>
        </EuiFlexGroup>
      )
  }

  const showToast = (color, title, time) => {
    getToasts().add({
      color: color,
      title: title,
      toastLifeTimeMs: time,
    });
  };

  const downloadCsv = async () => {
    try {
      const filtersObject = filtersToObject(filters);
      const formatedFilters = Object.keys(filtersObject).map(key => ({name: key, value: filtersObject[key]}));
      showToast('success', 'Your download should begin automatically...', 3000);
      await exportCsv(
        endpoint,
        [
          ...formatedFilters
        ],
        `vuls-${(rest.title).toLowerCase()}`
      );
    } catch (error) {
      showToast('danger', error, 3000);
    }
  }

  const title = renderTitle();
  
  return <>
  {title}
  <TableWithSearchBar
    onSearch={onSearch}
    {...rest}
  />
  </>
}