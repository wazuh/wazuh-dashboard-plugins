import React from 'react';
import {
  EuiBasicTable,
  EuiBasicTableColumn,
  EuiEmptyPrompt,
} from '@elastic/eui';
import { ScaBenchmark } from '../../interfaces/types';
import { TabNumber } from '../common';

export interface ScaBenchmarksTableProps {
  items: ScaBenchmark[];
}

const NO_BENCHMARKS = (
  <EuiEmptyPrompt
    iconType='visVega'
    titleSize='xs'
    title={<h4>No SCA benchmarks found</h4>}
    body={<p>Check your agents&apos; SCA configuration to generate scans.</p>}
  />
);

export const ScaBenchmarksTable: React.FC<ScaBenchmarksTableProps> = ({
  items,
}) => {
  const columns: Array<EuiBasicTableColumn<ScaBenchmark>> = [
    { field: 'name', name: 'Top 5 benchmarks', truncateText: true },
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
        <span className='tab-num'>{score.toFixed(2)}%</span>
      ),
    },
  ];

  return (
    <div style={{ overflowX: 'auto', minWidth: 400 }}>
      <EuiBasicTable
        items={items}
        columns={columns}
        tableLayout='fixed'
        noItemsMessage={NO_BENCHMARKS}
        data-test-subj='sca-benchmarks-table'
      />
    </div>
  );
};
