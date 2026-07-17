import React from 'react';
import { TopNTable } from '../common';
import { TopItem } from '../../types';

export interface TopOsTableProps {
  items: TopItem[];
}

export const TopOsTable: React.FC<TopOsTableProps> = ({ items }) => (
  <TopNTable
    items={items}
    keyColumnName='Operating system'
    noItemsMessage='No operating systems found'
    data-test-subj='top-os-table'
  />
);
