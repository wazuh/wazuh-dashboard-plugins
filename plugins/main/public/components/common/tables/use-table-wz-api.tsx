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

import { useCallback, useEffect, useState } from 'react';
import { WzRequest } from '../../../react-services/wz-request';
import { useStateStorage, useAppConfig } from '../hooks';

/**
 * Search input custom filter button
 */
interface CustomFilterButton {
  label: string;
  field: string;
  value: string;
}

export interface Filters {
  [key: string]: string;
}

const getFilters = (filters: Filters) => {
  const { default: defaultFilters, ...restFilters } = filters;
  return Object.keys(restFilters).length ? restFilters : defaultFilters;
};

const formatSorting = sorting => {
  if (!sorting.field || !sorting.direction) {
    return '';
  }
  return `${sorting.direction === 'asc' ? '+' : '-'}${sorting.field}`;
};

export interface UseTableWzAPIProps {
  endpoint: string;
  tableColumns: Array<{ field: string; name: string; show?: boolean }>;
  tablePageSizeOptions?: number[];
  tableInitialSortingField?: string;
  tableInitialSortingDirection?: 'asc' | 'desc';
  saveStateStorage?: {
    system?: 'localStorage' | 'sessionStorage';
    key?: string;
  };
  mapResponseItem?: (item: any) => any;
  onFiltersChange?: (filters: Filters) => void;
  onDataChange?: (data: { items: any[]; totalItems: number }) => void;
  reload?: boolean | number;
  setReload?: (newValue: number) => void;
}

export interface UseTableWzAPIReturn {
  totalItems: number;
  filters: Filters;
  isLoading: boolean;
  sort: { field?: string; direction?: 'asc' | 'desc' };
  selectedFields: string[];
  setSelectedFields: React.Dispatch<React.SetStateAction<string[]>>;
  tableState: {
    pageSize: number;
    sorting: {
      field: string;
      direction: 'asc' | 'desc';
    };
  };
  isOpenFieldSelector: boolean;
  setIsOpenFieldSelector: React.Dispatch<React.SetStateAction<boolean>>;
  maxRows: number;
  onSearch: (
    endpoint: string,
    filters: Filters,
    pagination: { pageIndex: number; pageSize: number },
    sorting: { sort: { field: string; direction: string } },
  ) => Promise<{ items: any[]; totalItems: number }>;
  triggerReload: () => void;
  reloadFootprint: number;
  getFilters: (filters: Filters) => Filters;
  formatSorting: (sort: {
    field?: string;
    direction?: 'asc' | 'desc';
  }) => string;
}

export const useTableWzAPI = (
  props: UseTableWzAPIProps,
): UseTableWzAPIReturn => {
  const {
    endpoint,
    tableColumns,
    tablePageSizeOptions,
    tableInitialSortingField,
    tableInitialSortingDirection,
    saveStateStorage,
    mapResponseItem,
    onFiltersChange: onFiltersChangeProp,
    onDataChange: onDataChangeProp,
    reload,
    setReload,
  } = props;

  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState<Filters>({});
  const [isLoading, setIsLoading] = useState(false);
  const [sort, setSort] = useState<{
    field?: string;
    direction?: 'asc' | 'desc';
  }>({});

  const onFiltersChange = useCallback(
    (filters: Filters) => {
      if (typeof onFiltersChangeProp === 'function') {
        onFiltersChangeProp(filters);
      }
    },
    [onFiltersChangeProp],
  );

  const onDataChange = useCallback(
    (data: { items: any[]; totalItems: number }) => {
      if (typeof onDataChangeProp === 'function') {
        onDataChangeProp(data);
      }
    },
    [onDataChangeProp],
  );

  /**
   * Changing the reloadFootprint timestamp will trigger reloading the table
   */
  const [reloadFootprint, setReloadFootprint] = useState(reload || 0);

  const [selectedFields, setSelectedFields] = useStateStorage(
    tableColumns.some(({ show }) => show)
      ? tableColumns.filter(({ show }) => show).map(({ field }) => field)
      : tableColumns.map(({ field }) => field),
    saveStateStorage?.system,
    saveStateStorage?.key
      ? `${saveStateStorage.key}-visible-fields`
      : undefined,
  );

  // Persist page size and sorting together
  const defaultPageSize = tablePageSizeOptions?.[0] || 15;
  const defaultSorting = {
    field: tableInitialSortingField || '',
    direction: tableInitialSortingDirection || 'asc',
  };

  const [tableStateRaw, setTableStateRaw] = useStateStorage(
    {
      pageSize: defaultPageSize,
      sorting: defaultSorting,
    },
    saveStateStorage?.system,
    saveStateStorage?.key ? `${saveStateStorage.key}-table-state` : undefined,
  );

  // Ensure tableState has the correct structure with defaults
  const tableState = {
    pageSize: tableStateRaw?.pageSize ?? defaultPageSize,
    sorting: tableStateRaw?.sorting?.field
      ? {
          field: tableStateRaw.sorting.field,
          direction:
            tableStateRaw.sorting.direction ?? defaultSorting.direction,
        }
      : defaultSorting,
  };

  const [isOpenFieldSelector, setIsOpenFieldSelector] = useState(false);
  const appConfig = useAppConfig();
  const maxRows = appConfig.data['reports.csv.maxRows'];

  const onSearch = useCallback(
    async function (
      endpoint: string,
      filters: Filters,
      pagination: { pageIndex: number; pageSize: number },
      sorting: { sort: { field: string; direction: string } },
    ) {
      try {
        const { pageIndex, pageSize } = pagination;
        setSort(sorting.sort);

        // Update persisted table state when page size or sorting changes
        setTableStateRaw(prevState => ({
          pageSize,
          sorting: sorting.sort?.field
            ? sorting.sort
            : { field: '', direction: 'asc' },
        }));

        setIsLoading(true);
        setFilters(filters);
        onFiltersChange(filters);
        const params = {
          ...getFilters(filters),
          offset: pageIndex * pageSize,
          limit: pageSize,
          sort: formatSorting(sorting.sort),
        };
        const response = await WzRequest.apiReq('GET', endpoint, { params });

        const { affected_items: items, total_affected_items: totalItems } = (
          (response || {}).data || {}
        ).data;
        setIsLoading(false);
        setTotalItems(totalItems);

        const result = {
          items: mapResponseItem ? items.map(mapResponseItem) : items,
          totalItems,
        };

        onDataChange(result);

        return result;
      } catch (error) {
        setIsLoading(false);
        setTotalItems(0);
        if (error?.name) {
          /* This replaces the error name. The intention is that an AxiosError
          doesn't appear in the toast message.
          TODO: This should be managed by the service that does the request instead of only changing
          the name in this case.
        */
          error.name = 'RequestError';
        }
        throw error;
      }
    },
    [setTableStateRaw, onFiltersChange, onDataChange, mapResponseItem],
  );

  /**
   *  Generate a new reload footprint and set reload to propagate refresh
   */
  const triggerReload = useCallback(() => {
    setReloadFootprint(Date.now());
    if (setReload) {
      setReload(Date.now());
    }
  }, [setReload]);

  useEffect(() => {
    if (reload) {
      triggerReload();
    }
  }, [reload, triggerReload]);

  return {
    totalItems,
    filters,
    isLoading,
    sort,
    selectedFields,
    setSelectedFields,
    tableState,
    isOpenFieldSelector,
    setIsOpenFieldSelector,
    maxRows,
    onSearch,
    triggerReload,
    reloadFootprint,
    getFilters,
    formatSorting: (sort: { field?: string; direction?: 'asc' | 'desc' }) =>
      formatSorting(sort),
  };
};
