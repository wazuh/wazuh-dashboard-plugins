import React from 'react';
import { TopNTable } from './top-n-table';
import { TopItem } from '../services/types';

export interface TopRulesTableProps {
  items: TopItem[];
}

/** Top 5 rules driving finding volume, last 24 hours. */
export const TopRulesTable: React.FC<TopRulesTableProps> = ({ items }) => (
  <TopNTable
    items={items}
    keyColumnName='Top 5 rules'
    data-test-subj='top-rules-table'
  />
);
