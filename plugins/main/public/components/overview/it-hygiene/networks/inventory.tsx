import React from 'react';
import {
  ITHygieneNetworksInventoryInterfaces,
  ITHygieneNetworksInventoryNetworks,
  ITHygieneNetworksInventoryProtocols,
} from './inventories';
import { ITHygieneInventoryTabLayout } from '../common/components/inventory';
import { ITHygieneProccessesInventoryPorts } from '../processes/inventories';

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
    component: ITHygieneProccessesInventoryPorts,
  },
];

export const ITHygieneNetworksInventory = () => {
  return <ITHygieneInventoryTabLayout tabs={tabs} />;
};
