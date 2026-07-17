import React from 'react';
import { TopNTable } from '../common';
import { TopItem } from '../../types';

export interface TopNetworkServicesTableProps {
  items: TopItem[];
}

export const TopNetworkServicesTable: React.FC<
  TopNetworkServicesTableProps
> = ({ items }) => (
  <TopNTable
    items={items}
    keyColumnName='Process name'
    noItemsMessage='No network services found'
    data-test-subj='top-network-services-table'
  />
);
