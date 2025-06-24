import React from 'react';
import {
  ITHygieneUsersInventoryUsers,
  ITHygieneUsersInventoryGroups,
} from './inventories';
import { ITHygieneInventoryTabLayout } from '../common/components/inventory';

const tabs = [
  {
    id: 'users',
    name: 'Users',
    component: ITHygieneUsersInventoryUsers,
  },
  {
    id: 'groups',
    name: 'Groups',
    component: ITHygieneUsersInventoryGroups,
  },
];

export const ITHygieneUsersInventory = () => {
  return <ITHygieneInventoryTabLayout tabs={tabs} />;
};