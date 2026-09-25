import { i18n } from '@osd/i18n';
import React from 'react';
import {
  ITHygieneSystemInventoryHardware,
  ITHygieneSystemInventorySystem,
} from './inventories';
import { ModuleSubTabs } from '../../../common/tabs';

const tabs = [
  {
    id: 'os',
    name: i18n.translate('wazuh.itHygiene.systemInventory.tabs.os', {
      defaultMessage: 'OS',
    }),
    component: ITHygieneSystemInventorySystem,
  },
  {
    id: 'hardware',
    name: i18n.translate('wazuh.itHygiene.systemInventory.tabs.hardware', {
      defaultMessage: 'Hardware',
    }),
    component: ITHygieneSystemInventoryHardware,
  },
];

export const ITHygieneSystemInventory = () => {
  return <ModuleSubTabs tabs={tabs} />;
};
