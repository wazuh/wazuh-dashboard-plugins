import React from 'react';
import {
  ITHygienePackagesInventoryHotfixes,
  ITHygienePackagesInventoryPackages,
  ITHygienePackagesInventoryWebBrowsers,
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
  {
    id: 'web-browsers',
    name: 'Web browsers',
    component: ITHygienePackagesInventoryWebBrowsers,
  },
];

export const ITHygienePackagesInventory = () => {
  return <ModuleSubTabs tabs={tabs} />;
};
