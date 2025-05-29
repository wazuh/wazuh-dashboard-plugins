import React from 'react';
import {
  ITHygieneNetworksInventoryInterfaces,
  ITHygieneNetworksInventoryNetworks,
  ITHygieneNetworksInventoryProtocols,
} from './inventories';
import { ITHygieneInventoryTabLayout } from '../common/components/inventory';

const tabs = [
  {
    id: 'networks',
    name: 'Addresses',
    component: ITHygieneNetworksInventoryNetworks,
  },
  {
    id: 'interfaces',
    name: 'Interfaces',
    component: ITHygieneNetworksInventoryInterfaces,
  },
  {
    id: 'protocols',
    name: 'Types',
    component: ITHygieneNetworksInventoryProtocols,
  },
];

export const ITHygieneNetworksInventory = () => {
  return <ITHygieneInventoryTabLayout tabs={tabs} />;
};
