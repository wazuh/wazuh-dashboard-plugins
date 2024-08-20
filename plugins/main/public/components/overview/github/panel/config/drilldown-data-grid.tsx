import React, { useState, useEffect } from 'react';
import { EuiFlexItem } from '@elastic/eui';
import { ModuleConfigProps } from './module-config';
import {
  ErrorFactory,
  HttpError,
  ErrorHandler,
} from '../../../../../react-services/error-management';
import WazuhDataGrid from '../../../../common/wazuh-data-grid/wz-data-grid';
import { tDataGridColumn } from '../../../../common/data-grid';

type tDrillDownDataGridProps = {
  defaultTableColumns: tDataGridColumn[];
} & ModuleConfigProps;

export default function DrillDownDataGrid(props: tDrillDownDataGridProps) {
  const [results, setResults] = useState<any>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 15,
    pageSizeOptions: [15, 25, 50, 100],
  });
  const [sorting, setSorting] = useState<any[]>([]);

  const {
    fetchData,
    searchBarProps,
    indexPattern,
    fetchFilters,
    defaultTableColumns,
  } = props;

  useEffect(() => {
    if (!indexPattern) {
      return;
    }
    fetchData({
      query: searchBarProps.query,
      filters: fetchFilters,
      pagination,
      sorting,
      dateRange: searchBarProps.absoluteDateRange,

    })
      .then(results => {
        setResults(results);
      })
      .catch(error => {
        const searchError = ErrorFactory.create(HttpError, {
          error,
          message: 'Error fetching data',
        });
        ErrorHandler.handleError(searchError);
      });
  }, [
    JSON.stringify(fetchFilters),
    JSON.stringify(searchBarProps.query),
    JSON.stringify(pagination),
    JSON.stringify(sorting),
    JSON.stringify(searchBarProps.absoluteDateRange),
  ]);

  return (
    <EuiFlexItem>
      <WazuhDataGrid
        results={results}
        defaultColumns={defaultTableColumns}
        indexPattern={indexPattern}
        isLoading={false}
        exportFilters={fetchFilters}
        defaultPagination={pagination}
        onChangePagination={pagination => setPagination(pagination)}
        onChangeSorting={sorting => {
          setSorting(sorting);
        }}
        dateRange={searchBarProps?.absoluteDateRange}
      />
    </EuiFlexItem>
  );
}
