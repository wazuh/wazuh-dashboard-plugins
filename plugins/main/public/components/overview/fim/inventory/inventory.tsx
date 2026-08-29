import React from 'react';
import { InventoryFIMFiles } from './inventories';
import { ModuleSubTabs } from '../../../common/tabs';
import { InventoryFIMRegistryKeys } from './inventories/registry-keys/inventory';
import { InventoryFIMRegistryValues } from './inventories/registry-values/inventory';
import { fimI18n } from '../i18n';

const tabs = [
  {
    id: 'files',
    name: fimI18n.tabFiles,
    component: InventoryFIMFiles,
  },
  {
    id: 'registry-keys',
    name: fimI18n.tabRegistryKeys,
    component: InventoryFIMRegistryKeys,
  },
  {
    id: 'registry-values',
    name: fimI18n.tabRegistryValues,
    component: InventoryFIMRegistryValues,
  },
];

export const InventoryFIM = () => {
  return <ModuleSubTabs tabs={tabs} />;
};
