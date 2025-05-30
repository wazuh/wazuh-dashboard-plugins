import React from 'react';
import {
  ITHygieneSystemInventoryHardware,
  ITHygieneSystemInventorySystem,
} from './inventories';
import { ITHygieneInventoryTabLayout } from '../common/components/inventory';

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
  return <ITHygieneInventoryTabLayout tabs={tabs} />;
};
