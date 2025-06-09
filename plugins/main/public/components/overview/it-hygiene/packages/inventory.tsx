import React from 'react';
import {
  ITHygienePackagesInventoryHotfixes,
  ITHygienePackagesInventoryPackages,
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
];

export const ITHygienePackagesInventory = () => {
  return <ITHygieneInventoryTabLayout tabs={tabs} />;
};
