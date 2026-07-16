import React from 'react';
import { EuiLink } from '@elastic/eui';
import { TopNTable } from './top-n-table';
import { TopItem } from '../services/types';

export interface TopTechniquesTableProps {
  items: TopItem[];
  /** Clicking a row opens MITRE ATT&CK filtered to that technique. */
  onSelect: (item: TopItem) => void;
}

/** Top 5 MITRE ATT&CK techniques observed, last 24 hours, with clickable rows. */
export const TopTechniquesTable: React.FC<TopTechniquesTableProps> = ({
  items,
  onSelect,
}) => (
  <TopNTable
    items={items}
    keyColumnName='Top 5 techniques'
    countColumnName='Alerts'
    renderKey={item => (
      <EuiLink onClick={() => onSelect(item)}>{item.key}</EuiLink>
    )}
    noItemsMessage='No techniques observed in the last 24 hours'
    data-test-subj='top-techniques-table'
  />
);
