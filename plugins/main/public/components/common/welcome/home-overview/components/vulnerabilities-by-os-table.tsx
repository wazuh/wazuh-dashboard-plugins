import React from 'react';
import { TopNTable } from './top-n-table';
import { TopItem } from '../services/types';

export interface VulnerabilitiesByOsTableProps {
  items: TopItem[];
}

/** Vulnerabilities broken down by operating system. */
export const VulnerabilitiesByOsTable: React.FC<
  VulnerabilitiesByOsTableProps
> = ({ items }) => (
  <TopNTable
    items={items}
    keyColumnName='Vulnerabilities by OS'
    data-test-subj='vulnerabilities-by-os-table'
  />
);
