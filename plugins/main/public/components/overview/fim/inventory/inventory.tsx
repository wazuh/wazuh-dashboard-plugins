import { i18n } from '@osd/i18n';
import React from 'react';
import { InventoryFIMFiles } from './inventories';
import { ModuleSubTabs } from '../../../common/tabs';
import { InventoryFIMRegistryKeys } from './inventories/registry-keys/inventory';
import { InventoryFIMRegistryValues } from './inventories/registry-values/inventory';

const tabs = [
  {
    id: 'files',
    name: i18n.translate('wazuh.fileIntegrityMonitoring.inventoryTabs.files', {
      defaultMessage: 'Files',
    }),
    component: InventoryFIMFiles,
  },
  {
    id: 'registry-keys',
    name: i18n.translate(
      'wazuh.fileIntegrityMonitoring.inventoryTabs.registryKeys',
      {
        defaultMessage: 'Registry keys',
      },
    ),
    component: InventoryFIMRegistryKeys,
  },
  {
    id: 'registry-values',
    name: i18n.translate(
      'wazuh.fileIntegrityMonitoring.inventoryTabs.registryValues',
      {
        defaultMessage: 'Registry values',
      },
    ),
    component: InventoryFIMRegistryValues,
  },
];

export const InventoryFIM = () => {
  return <ModuleSubTabs tabs={tabs} />;
};
