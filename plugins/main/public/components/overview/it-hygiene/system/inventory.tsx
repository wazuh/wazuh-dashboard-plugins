import React from 'react';
import {
  ITHygieneSystemInventoryHardware,
  ITHygieneSystemInventorySystem,
} from './inventories';
import { ModuleSubTabs } from '../../../common/tabs';

const tabs = [
  {
    id: 'os',
    name: 'OS',
    component: ITHygieneSystemInventorySystem,
  },
  {
    id: 'hardware',
    name: 'Hardware',
    component: ITHygieneSystemInventoryHardware,
  },
];

export const ITHygieneSystemInventory = () => {
  return <ModuleSubTabs tabs={tabs} />;
};
