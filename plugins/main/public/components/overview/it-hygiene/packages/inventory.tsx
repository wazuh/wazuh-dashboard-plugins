import React from 'react';
import {
  ITHygienePackagesInventoryHotfixes,
  ITHygienePackagesInventoryPackages,
  ITHygienePackagesInventoryWebBrowsers,
} from './inventories';
import { ITHygieneInventoryTabLayout } from '../common/components/inventory';

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
  return <ITHygieneInventoryTabLayout tabs={tabs} />;
};
