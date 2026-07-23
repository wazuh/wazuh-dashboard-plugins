import React from 'react';
import { EuiBasicTable, EuiBasicTableColumn } from '@elastic/eui';
import { ScaBenchmark } from '../../interfaces/types';
import { TabNumber } from '../common';
import { decimalFormat } from '../../../utils/helpers';

export interface ScaBenchmarksTableProps {
  items: ScaBenchmark[];
}

export const ScaBenchmarksTable: React.FC<ScaBenchmarksTableProps> = ({
  items,
}) => {
  const scoreFormatter = decimalFormat();
  const columns: Array<EuiBasicTableColumn<ScaBenchmark>> = [
    {
      field: 'name',
      name: 'Top 5 benchmarks',
      truncateText: true,
      render: (value: string) => <span style={{
        cursor: 'default',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }} title={value}>{value}</span>,
    },
    {
      field: 'passed',
      name: 'Passed',
      align: 'right',
      width: '90px',
      render: (count: number) => <TabNumber value={count} />,
    },
    {
      field: 'failed',
      name: 'Failed',
      align: 'right',
      width: '90px',
      render: (count: number) => <TabNumber value={count} />,
    },
    {
      field: 'score',
      name: 'Score',
      align: 'right',
      width: '90px',
      render: (score: number) => (
        <span className='tab-num'>{scoreFormatter.convert(score)}</span>
      ),
    },
  ];

  return (
    <div style={{ overflowX: 'auto', minWidth: 400 }}>
      <EuiBasicTable
        items={items}
        columns={columns}
        tableLayout='fixed'
        noItemsMessage='No SCA benchmarks found'
        data-test-subj='sca-benchmarks-table'
      />
    </div>
  );
};
