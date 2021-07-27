import { EuiBasicTable, EuiPanel, EuiTitle, EuiBasicTableColumn } from '@elastic/eui';
import { useEsSearch } from '../../../hooks';
import React from 'react';

export const AggTable = ({
  onRowClick = (field, value) => {},
  aggTerm,
  aggLabel,
  maxRows,
  tableTitle,
  panelProps,
  titleProps
}) => {
  const preAppliedAggs = {
    buckets: {
      terms: {
        field: aggTerm,
        size: maxRows,
        order: { _count: 'desc' },
      },
    },
  };
  const  {esResults, isLoading, error}  = useEsSearch({ preAppliedAggs });
  const buckets = ((esResults.aggregations || {}).buckets || {}).buckets || [];
  const columns:EuiBasicTableColumn<any>[] = [
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
      <EuiBasicTable items={buckets} columns={columns} rowProps={getRowProps} loading={isLoading} error={error ? error.message : undefined} />
    </EuiPanel>
  );
};
