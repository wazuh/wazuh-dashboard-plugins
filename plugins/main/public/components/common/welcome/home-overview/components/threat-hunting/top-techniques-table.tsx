import React from 'react';
import { EuiLink } from '@elastic/eui';
import { TopNTable } from '../common';
import { TopItem } from '../../interfaces/types';

export interface TopTechniquesTableProps {
  items: TopItem[];
  onSelect: (item: TopItem) => string | undefined;
}

export const TopTechniquesTable: React.FC<TopTechniquesTableProps> = ({
  items,
  onSelect,
}) => (
  <TopNTable
    items={items}
    keyColumnName='Top 5 techniques'
    countColumnName='Alerts'
    noItemsMessage='No techniques observed'
    data-test-subj='top-techniques-table'
  />
);
