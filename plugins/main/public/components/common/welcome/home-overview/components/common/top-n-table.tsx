import React from 'react';
import { EuiBasicTable, EuiBasicTableColumn } from '@elastic/eui';
import { TopItem } from '../../interfaces/types';
import { TabNumber } from './tab-number';
import { EmptyState } from './empty-state';
import { WIDGET_LOADING_MIN_HEIGHT } from './widget-group';

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
        : (value: string) => (
            <span
              style={{
                cursor: 'default',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={value}
            >
              {value}
            </span>
          ),
    },
    {
      field: 'count',
      name: countColumnName,
      align: 'right',
      width: '90px',
      render: (count: number) => <TabNumber value={count} />,
    },
  ];

  return (
    <div style={{ overflowX: 'auto', minWidth: 240 }}>
      <EuiBasicTable
        items={items}
        columns={columns}
        tableLayout='fixed'
        noItemsMessage={
          noItemsMessage ? (
            <EmptyState
              message={noItemsMessage}
              minHeight={WIDGET_LOADING_MIN_HEIGHT.list}
            />
          ) : undefined
        }
        data-test-subj={rest['data-test-subj']}
      />
    </div>
  );
};

/** Fixed presentation for a Top-N table, bound once by `createTopNTable`. */
export type TopNTableConfig = Omit<TopNTableProps, 'items'>;

export const createTopNTable = (
  config: TopNTableConfig,
): React.FC<{ items: TopItem[] }> => {
  const Table: React.FC<{ items: TopItem[] }> = ({ items }) => (
    <TopNTable items={items} {...config} />
  );
  Table.displayName = `TopNTable(${config['data-test-subj'] ?? 'unnamed'})`;
  return Table;
};
