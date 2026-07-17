import React from 'react';
import { TopNTable } from '../common';
import { TopItem } from '../../interfaces/types';

export interface TopRulesTableProps {
  items: TopItem[];
}

export const TopRulesTable: React.FC<TopRulesTableProps> = ({ items }) => (
  <TopNTable
    items={items}
    keyColumnName='Top 5 rules'
    noItemsMessage='No rules triggered in the last 24 hours'
    data-test-subj='top-rules-table'
  />
);
