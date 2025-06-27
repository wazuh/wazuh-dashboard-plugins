import React from 'react';
import {
  ITHygieneUsersInventoryUsers,
  ITHygieneUsersInventoryGroups,
} from './inventories';
import { ModuleSubTabs } from '../../../common/tabs';

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
  return <ModuleSubTabs tabs={tabs} />;
};
