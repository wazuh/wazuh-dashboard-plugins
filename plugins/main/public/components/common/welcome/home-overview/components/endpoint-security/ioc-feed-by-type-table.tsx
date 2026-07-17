import React from 'react';
import { TopNTable } from '../common';
import { TopItem } from '../../interfaces/types';

export interface IocFeedByTypeTableProps {
  items: TopItem[];
}

export const IocFeedByTypeTable: React.FC<IocFeedByTypeTableProps> = ({
  items,
}) => (
  <TopNTable
    items={items}
    keyColumnName='IOC feed by type (top 5)'
    noItemsMessage='No IOC indicators in the threat-intel feed'
    data-test-subj='ioc-feed-by-type-table'
  />
);
