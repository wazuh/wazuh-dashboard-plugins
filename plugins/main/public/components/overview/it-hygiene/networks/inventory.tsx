import React from 'react';
import {
  ITHygieneNetworksInventoryInterfaces,
  ITHygieneNetworksInventoryNetworks,
  ITHygieneNetworksInventoryProtocols,
  ITHygieneNetworksInventoryServices,
  ITHygieneNetworksInventoryTraffic,
} from './inventories';
import { ModuleSubTabs } from '../../../common/tabs';

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
    id: 'services',
    name: 'Services',
    component: ITHygieneNetworksInventoryServices,
  },
  {
    id: 'traffic',
    name: 'Traffic',
    component: ITHygieneNetworksInventoryTraffic,
  },
];

export const ITHygieneNetworksInventory = () => {
  return <ModuleSubTabs tabs={tabs} />;
};
