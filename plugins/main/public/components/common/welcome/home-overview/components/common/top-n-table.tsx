import React from 'react';
import { EuiBasicTable, EuiBasicTableColumn } from '@elastic/eui';
import { TopItem } from '../../types';
import { formatUINumber } from '../../../../../../react-services/format-number';

export interface TopNTableProps {
  items: TopItem[];
  keyColumnName: string;
  countColumnName?: string;
  renderKey?: (item: TopItem) => React.ReactNode;
  noItemsMessage?: React.ReactNode;
  ['data-test-subj']?: string;
}

export const TopNTable: React.FC<TopNTableProps> = ({
  items,
  keyColumnName,
  countColumnName = 'Count',
  renderKey,
  noItemsMessage,
  ...rest
}) => {
  const columns: Array<EuiBasicTableColumn<TopItem>> = [
    {
      field: 'key',
      name: keyColumnName,
      truncateText: true,
      render: renderKey
        ? (_value: string, item: TopItem) => renderKey(item)
        : undefined,
    },
    {
      field: 'count',
      name: countColumnName,
      align: 'right',
      width: '90px',
      render: (count: number) => (
        <span className='tab-num'>{formatUINumber(count)}</span>
      ),
    },
  ];

  return (
    <div style={{ overflowX: 'auto', minWidth: 240 }}>
      <EuiBasicTable
        items={items}
        columns={columns}
        tableLayout='fixed'
        noItemsMessage={noItemsMessage}
        data-test-subj={rest['data-test-subj']}
      />
    </div>
  );
};
