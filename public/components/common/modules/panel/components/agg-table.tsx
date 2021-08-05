/*
 * Wazuh app - React component Aggregations Table.
 *
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { EuiBasicTable, EuiPanel, EuiTitle, EuiBasicTableColumn } from '@elastic/eui';
import { useEsSearch } from '../../../hooks';
import React from 'react';

interface IAggTable {
  onRowClick(field: string, value: string): void;
  aggTerm: string;
  aggLabel: string;
  maxRows: number;
  tableTitle: string;
  panelProps?: any;
  titleProps?: any;
} 


export const AggTable = ({
  onRowClick = (field, value) => {},
  aggTerm,
  aggLabel,
  maxRows,
  tableTitle,
  panelProps,
  titleProps,
}: IAggTable) => {
  const preAppliedAggs = {
    buckets: {
      terms: {
        field: aggTerm,
        size: maxRows,
        order: { _count: 'desc' },
      },
    },
  };
  const { esResults, isLoading, error } = useEsSearch({ preAppliedAggs });
  const buckets = ((esResults.aggregations || {}).buckets || {}).buckets || [];
  const columns: EuiBasicTableColumn<any>[] = [
    {
      field: 'key',
      name: aggLabel,
    },
    {
      field: 'doc_count',
      name: 'Count',
      isExpander: false,
      align: 'right',
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

  return (
    <EuiPanel data-test-subj={`${aggTerm}-aggTable`} {...panelProps}>
      <EuiTitle {...titleProps}>
        <h2>{tableTitle}</h2>
      </EuiTitle>
      <EuiBasicTable
        items={buckets}
        columns={columns}
        rowProps={getRowProps}
        loading={isLoading}
        error={error ? error.message : undefined}
      />
    </EuiPanel>
  );
};
