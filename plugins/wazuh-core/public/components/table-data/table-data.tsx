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

import React, { useEffect, useState, useRef } from 'react';
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
  EuiBasicTable,
} from '@elastic/eui';
import { useStateStorage } from '../../hooks';
import { isEqual } from 'lodash';
import { TableDataProps } from './types';

const getColumMetaField = item => item.field || item.name;

export function TableData<T>({
  preActionButtons,
  postActionButtons,
  postTitle,
  onReload,
  fetchData,
  tablePageSizeOptions = [15, 25, 50, 100],
  tableInitialSortingDirection = 'asc',
  tableInitialSortingField = '',
  ...rest
}: TableDataProps<T>) {
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
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
  const [refresh, setRefresh] = useState(rest.reload || 0);
  const [fetchContext, setFetchContext] = useState(rest.fetchContext || {});

  const isMounted = useRef(false);
  const tableRef = useRef();

  const [selectedFields, setSelectedFields] = useStateStorage<string[]>(
    rest.tableColumns.some(({ show }) => show)
      ? rest.tableColumns.filter(({ show }) => show).map(({ field }) => field)
      : rest.tableColumns.map(({ field }) => field),
    rest?.saveStateStorage?.system,
    rest?.saveStateStorage?.key
      ? `${rest?.saveStateStorage?.key}-visible-fields`
      : undefined,
  );
  const [isOpenFieldSelector, setIsOpenFieldSelector] = useState(false);

  const onFetch = async ({ pagination, sorting }) => {
    try {
      const enhancedFetchContext = {
        pagination,
        sorting,
        fetchContext,
      };
      setIsLoading(true);
      rest?.onFetchContextChange?.(enhancedFetchContext);

      const { items, totalItems } = await fetchData(enhancedFetchContext);

      setIsLoading(false);
      setItems(items);
      setTotalItems(totalItems);

      const result = {
        items: rest.mapResponseItem ? items.map(rest.mapResponseItem) : items,
        totalItems,
      };

      rest?.onDataChange?.(result);
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
      return actionButtons({
        fetchContext,
        pagination,
        sorting,
        items,
        totalItems,
        tableColumns,
      });
    }
  };

  /**
   *  Generate a new reload footprint and set reload to propagate refresh
   */
  const triggerReload = () => {
    setRefresh(Date.now());
    if (onReload) {
      onReload(Date.now());
    }
  };

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
    // and will cause the effect is triggered (redoing the onFetch function).
    if (isMounted.current) {
      // Reset the page index when the reload changes.
      // This will cause that onFetch function is triggered because to changes in pagination in the another effect.
      updateRefresh();
    }
  }, [rest?.reload]);

  useEffect(() => {
    onFetch({ pagination, sorting });
  }, [fetchContext, pagination, sorting, refresh]);

  useEffect(() => {
    // This effect is triggered when the component is mounted because of how to the useEffect hook works.
    // We don't want to set the searchParams state because there is another effect that has this dependency
    // and will cause the effect is triggered (redoing the onFetch function).
    if (isMounted.current && !isEqual(rest.fetchContext, fetchContext)) {
      setFetchContext(rest.fetchContext);
      updateRefresh();
    }
  }, [rest?.fetchContext]);

  useEffect(() => {
    if (rest.reload) triggerReload();
  }, [rest.reload]);

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
            {postTitle ? (
              <EuiFlexItem className='wz-flex-basis-auto' grow={false}>
                {postTitle}
              </EuiFlexItem>
            ) : null}
          </EuiFlexGroup>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiFlexGroup wrap alignItems={'center'} responsive={false}>
            {/* Render optional custom action button */}
            {renderActionButtons(preActionButtons)}
            {/* Render optional reload button */}
            {rest.showActionReload && ReloadButton}
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

  const tableDataRenderElementsProps = {
    ...rest,
    tableColumns,
    isOpenFieldSelector,
    selectedFields,
    refresh,
    updateRefresh,
    fetchContext,
    setFetchContext,
    pagination,
    setPagination,
    sorting,
    setSorting,
    tableRef,
  };

  return (
    <EuiFlexGroup direction='column' gutterSize='s' responsive={false}>
      <EuiFlexItem>{header}</EuiFlexItem>
      {rest.description && (
        <EuiFlexItem>
          <EuiText color='subdued'>{rest.description}</EuiText>
        </EuiFlexItem>
      )}
      <TableDataRenderElement
        {...tableDataRenderElementsProps}
        render={rest.preTable}
      />
      <EuiFlexItem>
        <EuiBasicTable
          ref={tableRef}
          columns={tableColumns.map(
            ({ searchable, show, composeField, ...rest }) => ({ ...rest }),
          )}
          items={items}
          loading={isLoading}
          pagination={tablePagination}
          sorting={sorting}
          onChange={tableOnChange}
          rowProps={rest.rowProps}
          {...rest.tableProps}
        />
      </EuiFlexItem>
      <TableDataRenderElement
        {...tableDataRenderElementsProps}
        render={rest.postTable}
      />
    </EuiFlexGroup>
  );
}

const TableDataRenderElement = ({ render, ...rest }) => {
  if (typeof render === 'function') {
    return <EuiFlexItem>{render(rest)}</EuiFlexItem>;
  }
  if (typeof render === 'object') {
    return <EuiFlexItem>{render}</EuiFlexItem>;
  }
  return null;
};
