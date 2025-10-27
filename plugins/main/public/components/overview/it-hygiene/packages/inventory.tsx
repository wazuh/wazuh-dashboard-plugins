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
    id: 'browser-extensions',
    name: 'Browser extensions',
    component: ITHygienePackagesInventoryWebBrowsers,
  },
];

export const ITHygienePackagesInventory = () => {
  return <ModuleSubTabs tabs={tabs} />;
};
