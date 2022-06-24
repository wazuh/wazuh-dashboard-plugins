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
import { useEsSearch } from '../../../hooks';
import React, { useState, useMemo } from 'react';

export const AggTable = ({
  onRowClick = (field, value) => {},
  aggTerm,
  aggLabel,
  maxRows,
  tableTitle,
  panelProps,
  titleProps,
}) => {
  const [order, setOrder] = useState({ _count: 'desc' });
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

  const { esResults, isLoading, error } = useEsSearch({ preAppliedAggs });
  const buckets = ((esResults.aggregations || {}).buckets || {}).buckets || [];
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
        onRowClick(aggTerm, key);
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
};
