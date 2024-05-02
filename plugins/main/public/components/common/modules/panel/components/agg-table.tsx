/*
 * Wazuh app - React component Aggregations Table.
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { EuiPanel, EuiTitle, EuiBasicTableColumn, EuiInMemoryTable } from '@elastic/eui';
import { SearchResponse, IndexPattern } from '../../../../../../src/core/server';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { search } from '../../../search-bar/search-bar-service';
import { tFilter } from '../../../data-source';

type AggTableProps = {
  onRowClick?: (field: string, value: string) => void;
  aggTerm: string;
  aggLabel: string;
  maxRows: number;
  tableTitle: string;
  panelProps: any;
  titleProps: any;
  searchParams: {
    filters: tFilter[];
    indexPattern: IndexPattern;
    query: any;
  }
};

export const AggTable = React.memo(({
  onRowClick,
  aggTerm,
  aggLabel,
  maxRows,
  tableTitle,
  panelProps,
  titleProps,
  searchParams,
}: AggTableProps) => {
  const [order, setOrder] = useState({ _count: 'desc' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [esResults, setEsResults] = useState<SearchResponse | undefined>(undefined);
  const preAppliedAggs = useMemo(() => {
    return {
      buckets: {
        terms: {
          field: aggTerm,
          size: maxRows,
          order,
        },
      },
    };
  }, [order, aggTerm, maxRows]);

  const fetchAggData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await search({
        aggs: preAppliedAggs,
        filters: searchParams.filters,
        indexPattern: searchParams.indexPattern,
        query: searchParams.query
      })
      setEsResults(response);
    } catch (error) {
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [preAppliedAggs, searchParams.filters, searchParams.indexPattern, searchParams.query]);

  useEffect(() => {
    console.log('mount agg table');
    fetchAggData();
  }, [
    JSON.stringify(searchParams.filters),
    JSON.stringify(searchParams.query),
    JSON.stringify(searchParams.indexPattern),
  ])


  const buckets = ((esResults?.aggregations || {}).buckets || {}).buckets || [];
  const columns: EuiBasicTableColumn<any>[] = [
    {
      field: 'key',
      name: aggLabel,
      sortable: true,
    },
    {
      field: 'doc_count',
      name: 'Count',
      isExpander: false,
      align: 'right',
      sortable: true,
    },
  ];
  const getRowProps = (item) => {
    const { key } = item;
    return {
      'data-test-subj': `row-${key}`,
      onClick: () => {
        onRowClick && onRowClick(aggTerm, key);
      },
    };
  };
  const pagination = {
    hidePerPageOptions: true,
    pageSize: 10,
  };
  const sorting = {
    sort: {
      field: 'doc_count',
      direction: 'desc',
    },
  };
  const onTableChange = ({ sort = {} }) => {
    if (sort.field) {
      const field = { key: '_key', doc_count: '_count' }[sort.field];
      setOrder({ [field]: sort.direction });
    }
  };
  return (
    <EuiPanel data-test-subj={`${aggTerm}-aggTable`} {...panelProps}>
      <EuiTitle {...titleProps}>
        <h2>{tableTitle}</h2>
      </EuiTitle>
      <EuiInMemoryTable
        columns={columns}
        items={buckets}
        loading={isLoading}
        rowProps={getRowProps}
        error={error ? error.message : undefined}
        pagination={pagination}
        onTableChange={onTableChange}
        sorting={sorting}
      />
    </EuiPanel>
  );
});
