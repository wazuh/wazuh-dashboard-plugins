import React from 'react';
import {
  ITHygienePackagesInventoryHotfixes,
  ITHygienePackagesInventoryPackages,
} from './inventories';
import { ModuleSubTabs } from '../../../common/tabs';

const tabs = [
  {
    id: 'packages',
    name: 'Packages',
    component: ITHygienePackagesInventoryPackages,
  },
  {
    id: 'hotfixes',
    name: 'Windows KBs',
    component: ITHygienePackagesInventoryHotfixes,
  },
];

export const ITHygienePackagesInventory = () => {
  return <ModuleSubTabs tabs={tabs} />;
};
