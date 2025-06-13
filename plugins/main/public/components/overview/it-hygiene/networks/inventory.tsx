import React from 'react';
import {
  ITHygieneNetworksInventoryInterfaces,
  ITHygieneNetworksInventoryNetworks,
  ITHygieneNetworksInventoryProtocols,
  ITHygieneNetworksInventoryPorts,
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
    name: 'Protocols',
    component: ITHygieneNetworksInventoryProtocols,
  },
  {
    id: 'ports',
    name: 'Ports',
    component: ITHygieneNetworksInventoryPorts,
  },
];

export const ITHygieneNetworksInventory = () => {
  return <ITHygieneInventoryTabLayout tabs={tabs} />;
};
