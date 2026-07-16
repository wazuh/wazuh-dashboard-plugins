import React from 'react';
import { TopNTable } from './top-n-table';
import { TopItem } from '../services/types';

export interface TopNetworkServicesTableProps {
  items: TopItem[];
}

/** Top 5 network services — processes owning listening ports (ports inventory). */
export const TopNetworkServicesTable: React.FC<
  TopNetworkServicesTableProps
> = ({ items }) => (
  <TopNTable
    items={items}
    keyColumnName='Process name'
    data-test-subj='top-network-services-table'
  />
);
