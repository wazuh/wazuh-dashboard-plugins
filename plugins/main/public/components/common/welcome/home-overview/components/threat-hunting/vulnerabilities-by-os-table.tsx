import React from 'react';
import { TopNTable } from '../common';
import { TopItem } from '../../interfaces/types';

export interface VulnerabilitiesByOsTableProps {
  items: TopItem[];
}

export const VulnerabilitiesByOsTable: React.FC<
  VulnerabilitiesByOsTableProps
> = ({ items }) => (
  <TopNTable
    items={items}
    keyColumnName='Vulnerabilities by OS'
    noItemsMessage='No vulnerabilities found'
    data-test-subj='vulnerabilities-by-os-table'
  />
);
