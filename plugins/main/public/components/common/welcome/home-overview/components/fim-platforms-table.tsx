import React from 'react';
import { TopNTable } from './top-n-table';
import { TopItem } from '../services/types';

export interface FimPlatformsTableProps {
  items: TopItem[];
}

/** Top 5 platforms by baselined files & registry objects (FIM). */
export const FimPlatformsTable: React.FC<FimPlatformsTableProps> = ({
  items,
}) => (
  <TopNTable
    items={items}
    keyColumnName='Top 5 by platform'
    data-test-subj='fim-platforms-table'
  />
);
