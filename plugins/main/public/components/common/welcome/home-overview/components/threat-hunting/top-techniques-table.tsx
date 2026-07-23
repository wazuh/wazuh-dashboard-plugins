import React from 'react';
import { EuiLink } from '@elastic/eui';
import { TopNTable } from '../common';
import { TopItem } from '../../interfaces/types';

export interface TopTechniquesTableProps {
  items: TopItem[];
  onSelect: (item: TopItem) => void;
}

export const TopTechniquesTable: React.FC<TopTechniquesTableProps> = ({
  items,
  onSelect,
}) => (
  <TopNTable
    items={items}
    keyColumnName='Top 5 techniques'
    countColumnName='Alerts'
    renderKey={item => (
      <EuiLink href={onSelect(item)}>{item.key}</EuiLink>
    )}
    noItemsMessage='No techniques observed in the last 24 hours'
    data-test-subj='top-techniques-table'
  />
);
