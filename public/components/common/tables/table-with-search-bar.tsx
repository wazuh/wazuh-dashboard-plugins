/*
 * Wazuh app - Table with search bar
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { useState, useEffect, useRef } from 'react';
import { EuiBasicTable, EuiSpacer } from '@elastic/eui';
import _ from 'lodash';
import { WzSearchBar } from '../../wz-search-bar/';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { getErrorOrchestrator } from '../../../react-services/common-services';

export function TableWithSearchBar({
  onSearch,
  searchBarSuggestions,
  searchBarPlaceholder = 'Filter or search',
  searchBarProps = {},
  tableColumns,
  rowProps,
  tablePageSizeOptions = [15, 25, 50, 100],
  tableInitialSortingDirection = 'asc',
  tableInitialSortingField = '',
  tableProps = {},
  reload,
  endpoint,
  ...rest
}) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState(rest.filters || []);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: tablePageSizeOptions[0],
  });

  const [sorting, setSorting] = useState({
    sort: {
      field: tableInitialSortingField,
      direction: tableInitialSortingDirection,
    },
  });

  const isMounted = useRef(false);

  function tableOnChange({ page = {}, sort = {} }) {
    if (isMounted.current) {
      const { index: pageIndex, size: pageSize } = page;
      const { field, direction } = sort;
      setPagination({
        pageIndex,
        pageSize,
      });
      setSorting({
        sort: {
          field,
          direction,
        },
      });
    }
  }

  useEffect(() => {
    // This effect is triggered when the component is mounted because of how to the useEffect hook works.
    // We don't want to set the pagination state because there is another effect that has this dependency
    // and will cause the effect is triggered (redoing the onSearch function).
    if (isMounted.current) {
      // Reset the page index when the endpoint changes.
      // This will cause that onSearch function is triggered because to changes in pagination in the another effect.
      setPagination({ pageIndex: 0, pageSize: pagination.pageSize });
    }
  }, [endpoint, reload]);

  useEffect(function () {
    (async () => {
      try {
        setLoading(true);
        const { items, totalItems } = await onSearch(endpoint, filters, pagination, sorting);
        setItems(items);
        setTotalItems(totalItems);
      } catch (error) {
        setItems([]);
        setTotalItems(0);
        const options = {
          context: `${TableWithSearchBar.name}.useEffect`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          error: {
            error: error,
            message: error.message || error,
            title: `${error.name}: Error fetching items`,
          },
        };
        getErrorOrchestrator().handleError(options);
      }
      setLoading(false);
    })();
  }, [filters, pagination, sorting]);

  useEffect(() => {
    // This effect is triggered when the component is mounted because of how to the useEffect hook works.
    // We don't want to set the filters state because there is another effect that has this dependency
    // and will cause the effect is triggered (redoing the onSearch function).
    if (isMounted.current && !_.isEqual(rest.filters, filters)) {
      setFilters(rest.filters || []);
    }
  }, [rest.filters]);

  // It is required that this effect runs after other effects that use isMounted
  // to avoid that these effects run when the component is mounted, only running
  // when one of its dependencies changes.
  useEffect(() => {
    isMounted.current = true;
  }, []);

  const tablePagination = {
    ...pagination,
    totalItemCount: totalItems,
    pageSizeOptions: tablePageSizeOptions,
  };
  return (
    <>
      <WzSearchBar
        noDeleteFiltersOnUpdateSuggests
        filters={filters}
        onFiltersChange={setFilters}
        suggestions={searchBarSuggestions}
        placeholder={searchBarPlaceholder}
        {...searchBarProps}
      />
      <EuiSpacer size="s" />
      <EuiBasicTable
        columns={tableColumns}
        items={items}
        loading={loading}
        pagination={tablePagination}
        sorting={sorting}
        onChange={tableOnChange}
        rowProps={rowProps}
        {...tableProps}
      />
    </>
  );
}
