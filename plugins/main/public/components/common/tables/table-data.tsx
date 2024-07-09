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

import React, { ReactNode, useEffect, useState } from 'react';
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
import { useStateStorage } from '../hooks';
import { TableDataBasic } from './table-data-basic';

/**
 * Search input custom filter button
 */
interface CustomFilterButton {
  label: string;
  field: string;
  value: string;
}

const getFilters = searchParams => {
  return searchParams;
  // API could needs to extract the current filters from the default
  const { default: defaultFilters, ...restFilters } = filters;
  return Object.keys(restFilters).length ? restFilters : defaultFilters;
};

const getColumMetaField = item => item.field || item.name;

export function TableData({
  actionButtons,
  postActionButtons,
  addOnTitle,
  setReload,
  fetchData,
  ...rest
}: {
  actionButtons?:
    | ReactNode
    | ReactNode[]
    | (({ filters }: { filters }) => ReactNode);
  postActionButtons?:
    | ReactNode
    | ReactNode[]
    | (({ filters }: { filters }) => ReactNode);

  title?: string;
  addOnTitle?: ReactNode;
  description?: string;
  preTable?: ReactNode;
  postTable?: ReactNode;
  downloadCsv?: boolean | string;
  searchTable?: boolean;
  endpoint: string;
  buttonOptions?: CustomFilterButton[];
  onFiltersChange?: Function;
  showReload?: boolean;
  searchBarProps?: any;
  reload?: boolean;
  onDataChange?: Function;
  fetchData: ({
    pagination,
    sorting,
    searchParams,
  }) => Promise<{ items: any[]; totalItems: number }>;
  setReload?: (newValue: number) => void;
}) {
  const [totalItems, setTotalItems] = useState(0);
  const [searchContext, setSearchParams] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const onFiltersChange = searchContext =>
    typeof rest.onFiltersChange === 'function'
      ? rest.onFiltersChange(searchContext)
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

  const onSearch = async ({ pagination, sorting, searchParams }) => {
    try {
      const searchContext = { pagination, sorting, searchParams };
      setIsLoading(true);
      setSearchParams(searchContext);
      onFiltersChange(searchContext);

      const { items, totalItems } = await fetchData(searchContext);

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
  };

  const tableColumns = rest.tableColumns.filter(item =>
    selectedFields.includes(getColumMetaField(item)),
  );

  const renderActionButtons = actionButtons => {
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
      return actionButtons({ ...searchContext, totalItems, tableColumns });
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
      <EuiFlexGroup wrap alignItems='center' responsive={false}>
        <EuiFlexItem>
          <EuiFlexGroup wrap alignItems='center' responsive={false}>
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
            {renderActionButtons(actionButtons)}
            {/* Render optional reload button */}
            {rest.showReload && ReloadButton}
            {/* Render optional post custom action button */}
            {renderActionButtons(postActionButtons)}
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
              options={rest.tableColumns.map(item => {
                const metaField = getColumMetaField(item);
                return {
                  id: metaField,
                  label: item.name,
                  checked: selectedFields.includes(metaField),
                };
              })}
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

  return (
    <EuiFlexGroup direction='column' gutterSize='s' responsive={false}>
      <EuiFlexItem>{header}</EuiFlexItem>
      {rest.description && (
        <EuiFlexItem>
          <EuiText color='subdued'>{rest.description}</EuiText>
        </EuiFlexItem>
      )}
      {rest.preTable && <EuiFlexItem>{rest.preTable}</EuiFlexItem>}
      <EuiFlexItem>
        <TableDataBasic
          onSearch={onSearch}
          searchParams={rest.fetchParams}
          {...{ ...rest, reload: reloadFootprint }}
          tableColumns={tableColumns}
          selectedFields={selectedFields}
        />
      </EuiFlexItem>
      {rest.postTable && <EuiFlexItem>{rest.postTable}</EuiFlexItem>}
    </EuiFlexGroup>
  );
}
