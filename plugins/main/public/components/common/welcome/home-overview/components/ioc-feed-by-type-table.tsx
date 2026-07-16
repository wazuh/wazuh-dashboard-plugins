import React from 'react';
import { TopNTable } from './top-n-table';
import { TopItem } from '../services/types';

export interface IocFeedByTypeTableProps {
  items: TopItem[];
}

/** IOC feed by type (top 5) — hidden by the caller when Security Analytics
 * isn't installed. */
export const IocFeedByTypeTable: React.FC<IocFeedByTypeTableProps> = ({
  items,
}) => (
  <TopNTable
    items={items}
    keyColumnName='IOC feed by type (top 5)'
    data-test-subj='ioc-feed-by-type-table'
  />
);
