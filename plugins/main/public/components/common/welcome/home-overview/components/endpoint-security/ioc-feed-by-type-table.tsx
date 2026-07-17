import React from 'react';
import { TopNTable } from '../common';
import { TopItem } from '../../types';

export interface IocFeedByTypeTableProps {
  items: TopItem[];
}

export const IocFeedByTypeTable: React.FC<IocFeedByTypeTableProps> = ({
  items,
}) => (
  <TopNTable
    items={items}
    keyColumnName='IOC feed by type (top 5)'
    noItemsMessage='No IOC matches in the last 24 hours'
    data-test-subj='ioc-feed-by-type-table'
  />
);
