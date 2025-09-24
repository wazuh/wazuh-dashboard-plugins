import React from 'react';
import {
  ITHygieneNetworksInventoryInterfaces,
  ITHygieneNetworksInventoryNetworks,
  ITHygieneNetworksInventoryProtocols,
  ITHygieneNetworksInventoryServices,
  ITHygieneNetworksInventoryTraffic,
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
    id: 'listeners',
    name: 'Listeners',
    component: ITHygieneNetworksInventoryServices,
  },
  {
    id: 'traffic',
    name: 'Traffic',
    component: ITHygieneNetworksInventoryTraffic,
  },
];

export const ITHygieneNetworksInventory = () => {
  return <ITHygieneInventoryTabLayout tabs={tabs} />;
};
