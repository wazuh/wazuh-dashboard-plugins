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

import React, { useCallback } from 'react';
import { filtersToObject } from '../../wz-search-bar/';
import { TableWithSearchBar } from './table-with-search-bar';
import { WzRequest } from '../../../react-services/wz-request';

export function TableWithSearchBarWzAPI({endpoint, ...rest}){
  const onSearch = useCallback(async function(filters, pagination, sorting){
    try {
      const { pageIndex, pageSize } = pagination;
      const { field, direction } = sorting.sort;

      const params = {
        ...filtersToObject(filters),
        offset: pageIndex * pageSize,
        limit: pageSize,
        sort: `${direction === 'asc' ? '+' : '-'}${field}`
      };

      const response = await WzRequest.apiReq('GET', endpoint, { params });

      const { affected_items, total_affected_items } = ((response || {}).data || {}).data;
      
      return {items: affected_items, totalItems: total_affected_items};
    } catch (error) {
      return Promise.reject(error);
    }
  },[]);
  return <TableWithSearchBar
    onSearch={onSearch}
    {...rest}
  />
}