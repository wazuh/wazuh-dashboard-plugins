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

import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import {
  EuiTitle,
  EuiLoadingSpinner,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiButtonEmpty,
  EuiToolTip,
  EuiIcon,
  EuiCheckboxGroup,
  EuiIconTip,
} from '@elastic/eui';
import { TableWithSearchBar } from './table-with-search-bar';
import { TableDefault } from './table-default';
import { WzRequest } from '../../../react-services/wz-request';
import { ExportTableCsv } from './components/export-table-csv';
import { useStateStorage, useAppConfig } from '../hooks';
/**
 * Search input custom filter button
 */
interface CustomFilterButton {
  label: string;
  field: string;
  value: string;
}

interface Filters {
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

export function TableWzAPI({
  actionButtons,
  postActionButtons,
  addOnTitle,
  extra,
  setReload,
  ...rest
}: {
  actionButtons?:
    | ReactNode
    | ReactNode[]
    | (({ filters }: { filters: Filters }) => ReactNode);
  postActionButtons?:
    | ReactNode
    | ReactNode[]
    | (({ filters }: { filters: Filters }) => ReactNode);
  title?: string;
  addOnTitle?: ReactNode;
  description?: string;
  extra?: ReactNode;
  downloadCsv?: boolean | string;
  searchTable?: boolean;
  endpoint: string;
  buttonOptions?: CustomFilterButton[];
  onFiltersChange?: (filters: Filters) => void;
  showReload?: boolean;
  searchBarProps?: any;
  reload?: boolean;
  onDataChange?: Function;
  setReload?: (newValue: number) => void;
}) {
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState<Filters>({});
  const [isLoading, setIsLoading] = useState(false);
  const [sort, setSort] = useState({});
  const onFiltersChange = (filters: Filters) =>
    typeof rest.onFiltersChange === 'function'
      ? rest.onFiltersChange(filters)
      : null;

  const onDataChange = data =>
    typeof rest.onDataChange === 'function' ? rest.onDataChange(data) : null;

  /**
   * Changing the reloadFootprint timestamp will trigger reloading the table
   */
  const [reloadFootprint, setReloadFootprint] = useState(rest.reload || 0);

  const [selectedFields, setSelectedFields] = useStateStorage(
    rest.tableColumns.some(({ show }) => show)
      ? rest.tableColumns.filter(({ show }) => show).map(({ field }) => field)
      : rest.tableColumns.map(({ field }) => field),
    rest?.saveStateStorage?.system,
    rest?.saveStateStorage?.key
      ? `${rest?.saveStateStorage?.key}-visible-fields`
      : undefined,
  );
  const [isOpenFieldSelector, setIsOpenFieldSelector] = useState(false);
  const appConfig = useAppConfig();
  const maxRows = appConfig.data['reports.csv.maxRows'];
  const onSearch = useCallback(async function (
    endpoint,
    filters: Filters,
    pagination,
    sorting,
  ) {
    try {
      const { pageIndex, pageSize } = pagination;
      setSort(sorting.sort);
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
        items: rest.mapResponseItem ? items.map(rest.mapResponseItem) : items,
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
  []);

  const renderActionButtons = (actionButtons, filters) => {
    if (Array.isArray(actionButtons)) {
      return actionButtons.map((button, key) => (
        <EuiFlexItem key={key} grow={false}>
          {button}
        </EuiFlexItem>
      ));
    }

    if (typeof actionButtons === 'object') {
      return <EuiFlexItem grow={false}>{actionButtons}</EuiFlexItem>;
    }

    if (typeof actionButtons === 'function') {
      return actionButtons({ filters: getFilters(filters) });
    }
  };

  /**
   *  Generate a new reload footprint and set reload to propagate refresh
   */
  const triggerReload = () => {
    setReloadFootprint(Date.now());
    if (setReload) {
      setReload(Date.now());
    }
  };

  useEffect(() => {
    if (rest.reload) {
      triggerReload();
    }
  }, [rest.reload]);

  const ReloadButton = (
    <EuiFlexItem grow={false}>
      <EuiButtonEmpty iconType='refresh' onClick={() => triggerReload()}>
        Refresh
      </EuiButtonEmpty>
    </EuiFlexItem>
  );

  const header = (
    <>
      <EuiFlexGroup wrap alignItems='center' responsive={false}>
        <EuiFlexItem>
          <EuiFlexGroup wrap alignItems='center' responsive={false}>
            <EuiFlexItem className='wz-flex-basis-auto' grow={false}>
              {rest.title && (
                <EuiTitle data-test-subj='table-wz-api-title' size='s'>
                  <h1>
                    {rest.title}{' '}
                    {isLoading ? (
                      <EuiLoadingSpinner size='s' />
                    ) : (
                      <span>({totalItems})</span>
                    )}
                  </h1>
                </EuiTitle>
              )}
            </EuiFlexItem>
            {addOnTitle ? (
              <EuiFlexItem className='wz-flex-basis-auto' grow={false}>
                {addOnTitle}
              </EuiFlexItem>
            ) : null}
          </EuiFlexGroup>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiFlexGroup wrap alignItems={'center'} responsive={false}>
            {/* Render optional custom action button */}
            {renderActionButtons(actionButtons, filters)}
            {/* Render optional reload button */}
            {rest.showReload && ReloadButton}
            {/* Render optional export to CSV button */}
            {rest.downloadCsv && (
              <>
                <ExportTableCsv
                  endpoint={rest.endpoint}
                  totalItems={totalItems}
                  filters={getFilters({
                    ...filters,
                    sort: formatSorting(sort),
                  })}
                  title={
                    typeof rest.downloadCsv === 'string'
                      ? rest.downloadCsv
                      : rest.title
                  }
                />
                {totalItems > maxRows && (
                  <EuiIconTip
                    content={`The exported CSV will be limited to the first ${maxRows} lines. You can change this limit in Dashboard management > App Settings`}
                    size='m'
                    color='warning'
                    type='alert'
                  />
                )}
              </>
            )}
            {/* Render optional post custom action button */}
            {renderActionButtons(postActionButtons, filters)}
            {rest.showFieldSelector && (
              <EuiFlexItem grow={false}>
                <EuiToolTip content='Select visible fields' position='left'>
                  <EuiButtonEmpty
                    onClick={() => setIsOpenFieldSelector(state => !state)}
                  >
                    <EuiIcon type='managementApp' color='primary' />
                  </EuiButtonEmpty>
                </EuiToolTip>
              </EuiFlexItem>
            )}
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
      {isOpenFieldSelector && (
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiCheckboxGroup
              options={rest.tableColumns.map(item => ({
                id: item.field,
                label: item.name,
                checked: selectedFields.includes(item.field),
              }))}
              onChange={optionID => {
                setSelectedFields(state => {
                  if (state.includes(optionID)) {
                    if (state.length > 1) {
                      return state.filter(field => field !== optionID);
                    }
                    return state;
                  }
                  return [...state, optionID];
                });
              }}
              className='columnsSelectedCheckboxs'
              idToSelectedMap={{}}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      )}
    </>
  );

  const tableColumns = rest.tableColumns.filter(({ field }) =>
    selectedFields.includes(field),
  );

  const table = rest.searchTable ? (
    <TableWithSearchBar
      onSearch={onSearch}
      {...{ ...rest, reload: reloadFootprint }}
      tableColumns={tableColumns}
      selectedFields={selectedFields}
    />
  ) : (
    <TableDefault
      onSearch={onSearch}
      {...{ ...rest, reload: reloadFootprint }}
    />
  );

  return (
    <EuiFlexGroup direction='column' gutterSize='s' responsive={false}>
      <EuiFlexItem>{header}</EuiFlexItem>
      {rest.description && (
        <EuiFlexItem>
          <EuiText color='subdued'>{rest.description}</EuiText>
        </EuiFlexItem>
      )}
      {extra ? <EuiFlexItem>{extra}</EuiFlexItem> : null}
      <EuiFlexItem>{table}</EuiFlexItem>
    </EuiFlexGroup>
  );
}

// Set default props
TableWzAPI.defaultProps = {
  title: null,
  downloadCsv: false,
  searchBar: false,
};
