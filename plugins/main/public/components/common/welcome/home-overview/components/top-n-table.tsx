import React from 'react';
import { EuiBasicTable, EuiBasicTableColumn } from '@elastic/eui';
import { TopItem } from '../services/types';
import { formatUINumber } from '../../../../../react-services/format-number';

export interface TopNTableProps {
  items: TopItem[];
  keyColumnName: string;
  countColumnName?: string;
  /** Optional custom render for the key cell (e.g. a link). */
  renderKey?: (item: TopItem) => React.ReactNode;
  /** Shown in place of the OUI default "No items found" when `items` is
   * empty. */
  noItemsMessage?: React.ReactNode;
  ['data-test-subj']?: string;
}

/** A lightweight, non-paginated "top N" table for `{ key, count }` rows. */
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
    <EuiBasicTable
      items={items}
      columns={columns}
      tableLayout='fixed'
      noItemsMessage={noItemsMessage}
      data-test-subj={rest['data-test-subj']}
    />
  );
};
