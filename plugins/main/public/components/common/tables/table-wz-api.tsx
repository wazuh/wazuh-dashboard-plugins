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
} from '@elastic/eui';
import { filtersToObject } from '../../wz-search-bar';
import { TableWithSearchBar } from './table-with-search-bar';
import { TableDefault } from './table-default';
import { WzRequest } from '../../../react-services/wz-request';
import { ExportTableCsv } from './components/export-table-csv';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { getErrorOrchestrator } from '../../../react-services/common-services';

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
  ...rest
}: {
  actionButtons?: ReactNode | ReactNode[];
  title?: string;
  description?: string;
  downloadCsv?: boolean;
  searchTable?: boolean;
  endpoint: string;
  buttonOptions?: CustomFilterButton[];
  onFiltersChange?: Function;
  showReload?: boolean;
  searchBarProps?: any;
  reload?: boolean;
}) {
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const onFiltersChange = (filters) =>
    typeof rest.onFiltersChange === 'function' ? rest.onFiltersChange(filters) : null;

  /**
   * Changing the reloadFootprint timestamp will trigger reloading the table
   */
  const [reloadFootprint, setReloadFootprint] = useState(rest.reload || 0);

  const onSearch = useCallback(async function (endpoint, filters, pagination, sorting) {
    try {
      const { pageIndex, pageSize } = pagination;
      const { field, direction } = sorting.sort;
      setIsLoading(true);
      setFilters(filters);
      onFiltersChange(filters);
      const params = {
        ...filtersToObject(filters),
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
      return { items: rest.mapResponseItem ? items.map(rest.mapResponseItem) : items, totalItems };
    } catch (error) {
      setIsLoading(false);
      setTotalItems(0);
      const options = {
        context: `${TableWithSearchBar.name}.useEffect`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error,
          message: error.message || error,
          title: `${error.name}: Error searching items`,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  }, []);

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
      <EuiButtonEmpty
        isDisabled={totalItems == 0}
        iconType="refresh"
        onClick={() => triggerReload()}
      >
        Refresh
      </EuiButtonEmpty>
    </EuiFlexItem>
  );

  const header = (
    <EuiFlexGroup wrap>
      <EuiFlexItem className="wz-flex-basis-auto" grow={false}>
        {rest.title && (
          <EuiTitle size="s">
            <h1>
              {rest.title}{' '}
              {isLoading ? <EuiLoadingSpinner size="s" /> : <span>({totalItems})</span>}
            </h1>
          </EuiTitle>
        )}
        {rest.description && <EuiText color="subdued">{rest.description}</EuiText>}
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
              filters={filters}
              title={rest.title}
            />
          )}
        </EuiFlexGroup>
      </EuiFlexItem>
    </EuiFlexGroup>
  );

  const table = rest.searchTable ? (
    <TableWithSearchBar onSearch={onSearch} {...{ ...rest, reload: reloadFootprint }} />
  ) : (
    <TableDefault onSearch={onSearch} {...{ ...rest, reload: reloadFootprint }} />
  );

  return (
    <>
      {header}
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
