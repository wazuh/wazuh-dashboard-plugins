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

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { EuiBasicTable, EuiBasicTableProps, EuiSpacer } from '@elastic/eui';
import _ from 'lodash';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import { SearchBar, SearchBarProps } from '../../search-bar';

export interface ITableWithSearcHBarProps<T> {
  /**
   * Function to fetch the data
   */
  onSearch: (
    endpoint: string,
    filters: Record<string, any>,
    pagination: { pageIndex: number; pageSize: number },
    sorting: { sort: { field: string; direction: string } },
  ) => Promise<{ items: any[]; totalItems: number }>;
  /**
   * Properties for the search bar
   */
  searchBarProps?: Omit<
    SearchBarProps,
    'defaultMode' | 'modes' | 'onSearch' | 'input'
  >;
  /**
   * Columns for the table
   */
  tableColumns: EuiBasicTableProps<T>['columns'] & {
    composeField?: string[];
    searchable?: string;
    show?: boolean;
  };
  /**
   * Table row properties for the table
   */
  rowProps?: EuiBasicTableProps<T>['rowProps'];
  /**
   * Table page size options
   */
  tablePageSizeOptions?: number[];
  /**
   * Table initial sorting direction
   */
  tableInitialSortingDirection?: 'asc' | 'desc';
  /**
   * Table initial sorting field
   */
  tableInitialSortingField?: string;
  /**
   * Table properties
   */
  tableProps?: Omit<
    EuiBasicTableProps<T>,
    | 'columns'
    | 'items'
    | 'loading'
    | 'pagination'
    | 'sorting'
    | 'onChange'
    | 'rowProps'
  >;
  /**
   * Refresh the fetch of data
   */
  reload?: number;
  /**
   * API endpoint
   */
  endpoint: string;
  /**
   * Search bar properties for WQL
   */
  searchBarWQL?: any;
  /**
   * Visible fields
   */
  selectedFields: string[];
  /**
   * API request filters
   */
  filters?: any;
}

export function TableWithSearchBar<T>({
  onSearch,
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
}: ITableWithSearcHBarProps<T>) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState(rest.filters || {});
  const [filtersTimeMark, setFiltersTimeMark] = useState<number>(Date.now());
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
  const [refresh, setRefresh] = useState(Date.now());

  const isMounted = useRef(false);
  const tableRef = useRef();

  const searchBarWQLOptions = useMemo(
    () => ({
      searchTermFields: tableColumns
        .filter(
          ({ field, searchable }) =>
            searchable && rest.selectedFields.includes(field),
        )
        .map(({ field, composeField }) => [composeField || field].flat())
        .flat(),
      ...(rest?.searchBarWQL?.options || {}),
    }),
    [rest?.searchBarWQL?.options, rest?.selectedFields],
  );

  function updateRefresh() {
    setPagination({ pageIndex: 0, pageSize: pagination.pageSize });
    setRefresh(Date.now());
  }

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
      // Reset the page index when the endpoint or reload changes.
      // This will cause that onSearch function is triggered because to changes in pagination in the another effect.
      updateRefresh();
    }
  }, [endpoint, reload]);

  useEffect(
    function () {
      (async () => {
        try {
          setLoading(true);

          //Reset the table selection in case is enabled
          tableRef.current.setSelection([]);

          const { items, totalItems } = await onSearch(
            endpoint,
            filters,
            pagination,
            sorting,
          );
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
    },
    [filters, pagination, sorting, refresh],
  );

  useEffect(() => {
    // This effect is triggered when the component is mounted because of how to the useEffect hook works.
    // We don't want to set the filters state because there is another effect that has this dependency
    // and will cause the effect is triggered (redoing the onSearch function).
    if (isMounted.current && !_.isEqual(rest.filters, filters)) {
      setFilters(rest.filters || {});
      updateRefresh();
    }
  }, [rest.filters]);

  // It is required that this effect runs after other effects that use isMounted
  // to avoid that these effects run when the component is mounted, only running
  // when one of its dependencies changes.
  useEffect(() => {
    isMounted.current = true;
  }, []);

  useEffect(() => {
    setFiltersTimeMark(Date.now());
  }, [rest.filters]);

  const tablePagination = {
    ...pagination,
    totalItemCount: totalItems,
    pageSizeOptions: tablePageSizeOptions,
  };
  return (
    <>
      <SearchBar
        {...searchBarProps}
        defaultMode='wql'
        modes={[
          {
            id: 'wql',
            options: searchBarWQLOptions,
            ...(rest?.searchBarWQL?.suggestions
              ? { suggestions: rest.searchBarWQL.suggestions }
              : {}),
            ...(rest?.searchBarWQL?.validate
              ? { validate: rest.searchBarWQL.validate }
              : {}),
          },
        ]}
        input={rest?.filters?.q || ''}
        inputTimeMark={filtersTimeMark}
        onSearch={({ apiQuery }) => {
          // Set the query, reset the page index and update the refresh
          setFilters(apiQuery);
          updateRefresh();
        }}
      />
      <EuiSpacer size='s' />
      <EuiBasicTable
        data-test-subj='table-with-search-bar'
        ref={tableRef}
        columns={tableColumns.map(
          ({ searchable, show, composeField, ...rest }) => ({ ...rest }),
        )}
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
