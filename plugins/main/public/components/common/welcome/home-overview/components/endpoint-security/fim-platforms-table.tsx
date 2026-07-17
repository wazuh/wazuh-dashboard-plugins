import React from 'react';
import { TopNTable } from '../common';
import { TopItem } from '../../interfaces/types';

export interface FimPlatformsTableProps {
  items: TopItem[];
}

export const FimPlatformsTable: React.FC<FimPlatformsTableProps> = ({
  items,
}) => (
  <TopNTable
    items={items}
    keyColumnName='Top 5 by platform'
    noItemsMessage='No files or registry objects baselined yet'
    data-test-subj='fim-platforms-table'
  />
);
