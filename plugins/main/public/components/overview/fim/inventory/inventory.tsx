import React from 'react';
import { InventoryFIMFiles } from './inventories';
import { ModuleSubTabs } from '../../../common/tabs';
import { InventoryFIMRegistryKeys } from './inventories/registry-keys/inventory';
import { InventoryFIMRegistryValues } from './inventories/registry-values/inventory';

const tabs = [
  {
    id: 'files',
    name: 'Files',
    component: InventoryFIMFiles,
  },
  {
    id: 'registry-keys',
    name: 'Registry keys',
    component: InventoryFIMRegistryKeys,
  },
  {
    id: 'registry-values',
    name: 'Registry values',
    component: InventoryFIMRegistryValues,
  },
];

export const InventoryFIM = () => {
  return <ModuleSubTabs tabs={tabs} />;
};
