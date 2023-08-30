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
  EuiSpacer,
  EuiToolTip,
  EuiIcon,
  EuiCheckboxGroup,
} from '@elastic/eui';
import { TableWithSearchBar } from './table-with-search-bar';
import { TableDefault } from './table-default';
import { WzRequest } from '../../../react-services/wz-request';
import { ExportTableCsv } from './components/export-table-csv';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import { useStateStorage } from '../hooks';

/**
 * Search input custom filter button
 */
interface CustomFilterButton {
  label: string;
  field: string;
  value: string;
}

const getFilters = filters => {
  const { default: defaultFilters, ...restFilters } = filters;
  return Object.keys(restFilters).length ? restFilters : defaultFilters;
};

export function TableWzAPI({
  actionButtons,
  ...rest
}: {
  actionButtons?: ReactNode | ReactNode[];
  title?: string;
  description?: string;
  downloadCsv?: boolean | string;
  searchTable?: boolean;
  endpoint: string;
  buttonOptions?: CustomFilterButton[];
  onFiltersChange?: Function;
  showReload?: boolean;
  searchBarProps?: any;
  reload?: boolean;
}) {
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const onFiltersChange = filters =>
    typeof rest.onFiltersChange === 'function'
      ? rest.onFiltersChange(filters)
      : null;

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

  const onSearch = useCallback(async function (
    endpoint,
    filters,
    pagination,
    sorting,
  ) {
    try {
      const { pageIndex, pageSize } = pagination;
      const { field, direction } = sorting.sort;
      setIsLoading(true);
      setFilters(filters);
      onFiltersChange(filters);
      const params = {
        ...getFilters(filters),
        offset: pageIndex * pageSize,
        limit: pageSize,
        sort: `${direction === 'asc' ? '+' : '-'}${field}`,
      };

      const response = await WzRequest.apiReq('GET', endpoint, { params });

      const { affected_items: items, total_affected_items: totalItems } = (
        (response || {}).data || {}
      ).data;
      setIsLoading(false);
      setTotalItems(totalItems);
      return {
        items: rest.mapResponseItem ? items.map(rest.mapResponseItem) : items,
        totalItems,
      };
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

  const renderActionButtons = (
    <>
      {Array.isArray(actionButtons)
        ? actionButtons.map((button, key) => (
            <EuiFlexItem key={key} grow={false}>
              {button}
            </EuiFlexItem>
          ))
        : typeof actionButtons === 'object' && (
            <EuiFlexItem grow={false}>{actionButtons}</EuiFlexItem>
          )}
    </>
  );

  /**
   *  Generate a new reload footprint
   */
  const triggerReload = () => {
    setReloadFootprint(Date.now());
  };

  useEffect(() => {
    if (rest.reload) triggerReload();
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
      <EuiFlexGroup wrap>
        <EuiFlexItem className='wz-flex-basis-auto' grow={false}>
          {rest.title && (
            <EuiTitle size='s'>
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
          {rest.description && (
            <EuiText color='subdued'>{rest.description}</EuiText>
          )}
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiFlexGroup wrap justifyContent={'flexEnd'} alignItems={'center'}>
            {/* Render optional custom action button */}
            {renderActionButtons}
            {/* Render optional reload button */}
            {rest.showReload && ReloadButton}
            {/* Render optional export to CSV button */}
            {rest.downloadCsv && (
              <ExportTableCsv
                endpoint={rest.endpoint}
                totalItems={totalItems}
                filters={getFilters(filters)}
                title={
                  typeof rest.downloadCsv === 'string'
                    ? rest.downloadCsv
                    : rest.title
                }
              />
            )}
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
    <>
      {header}
      {rest.description && <EuiSpacer />}
      {table}
    </>
  );
}

// Set default props
TableWzAPI.defaultProps = {
  title: null,
  downloadCsv: false,
  searchBar: false,
};
