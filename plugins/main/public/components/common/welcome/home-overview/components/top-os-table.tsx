import React from 'react';
import { TopNTable } from './top-n-table';
import { TopItem } from '../services/types';

export interface TopOsTableProps {
  items: TopItem[];
}

/** Top 5 operating systems across the fleet (system inventory). */
export const TopOsTable: React.FC<TopOsTableProps> = ({ items }) => (
  <TopNTable
    items={items}
    keyColumnName='Operating system'
    data-test-subj='top-os-table'
  />
);
