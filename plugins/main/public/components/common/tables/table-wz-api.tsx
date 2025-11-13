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

import React, { ReactNode } from 'react';
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
} from '@elastic/eui';
import { TableWithSearchBar } from './table-with-search-bar';
import { TableDefault } from './table-default';
import { ExportTableCsv } from './components/export-table-csv';
import { formatUINumber } from '../../../react-services/format-number';
import { useTableWzAPI, Filters } from './use-table-wz-api';

/**
 * Search input custom filter button
 */
interface CustomFilterButton {
  label: string;
  field: string;
  value: string;
}

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
  reload?: boolean | number;
  onDataChange?: (data: { items: any[]; totalItems: number }) => void;
  setReload?: (newValue: number) => void;
  tableColumns: Array<{
    field: string;
    name: string;
    show?: boolean;
    [key: string]: any;
  }>;
  tablePageSizeOptions?: number[];
  tableInitialSortingField?: string;
  tableInitialSortingDirection?: 'asc' | 'desc';
  saveStateStorage?: {
    system?: 'localStorage' | 'sessionStorage';
    key?: string;
  };
  mapResponseItem?: (item: any) => any;
  showFieldSelector?: boolean;
  rowProps?: any;
  [key: string]: any;
}) {
  const {
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
    formatSorting,
  } = useTableWzAPI({
    endpoint: rest.endpoint,
    tableColumns: rest.tableColumns,
    tablePageSizeOptions: rest.tablePageSizeOptions,
    tableInitialSortingField: rest.tableInitialSortingField,
    tableInitialSortingDirection: rest.tableInitialSortingDirection,
    saveStateStorage: rest.saveStateStorage,
    mapResponseItem: rest.mapResponseItem,
    onFiltersChange: rest.onFiltersChange,
    onDataChange: rest.onDataChange,
    reload: rest.reload,
    setReload,
  });

  const renderActionButtons = (
    actionButtons:
      | ReactNode
      | ReactNode[]
      | (({ filters }: { filters: Filters }) => ReactNode),
    filters: Filters,
  ) => {
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
                      <span>({formatUINumber(totalItems)})</span>
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
                  maxRows={maxRows}
                />
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
              options={rest.tableColumns.map(
                (item: { field: string; name: string }) => ({
                  id: item.field,
                  label: item.name,
                  checked: selectedFields.includes(item.field),
                }),
              )}
              onChange={(optionID: string) => {
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

  const tableColumns = rest.tableColumns.filter(
    ({ field }: { field: string }) => selectedFields.includes(field),
  );

  const table = rest.searchTable ? (
    <TableWithSearchBar
      onSearch={onSearch}
      {...{ ...rest, reload: reloadFootprint }}
      tableColumns={tableColumns}
      selectedFields={selectedFields}
      tableInitialPageSize={tableState.pageSize}
      tableInitialSortingField={tableState.sorting.field}
      tableInitialSortingDirection={tableState.sorting.direction}
    />
  ) : (
    <TableDefault
      onSearch={onSearch}
      {...{ ...rest, reload: reloadFootprint }}
      tableColumns={tableColumns}
      tableInitialPageSize={tableState.pageSize}
      tableInitialSortingField={tableState.sorting.field}
      tableInitialSortingDirection={tableState.sorting.direction}
      rowProps={rest.rowProps}
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
