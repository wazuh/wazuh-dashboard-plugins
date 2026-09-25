import { i18n } from '@osd/i18n';
import React from 'react';
import {
  ITHygieneUsersInventoryUsers,
  ITHygieneUsersInventoryGroups,
} from './inventories';
import { ModuleSubTabs } from '../../../common/tabs';

const tabs = [
  {
    id: 'users',
    name: i18n.translate('wazuh.itHygiene.usersInventory.tabs.users', {
      defaultMessage: 'Users',
    }),
    component: ITHygieneUsersInventoryUsers,
  },
  {
    id: 'groups',
    name: i18n.translate('wazuh.itHygiene.usersInventory.tabs.groups', {
      defaultMessage: 'Groups',
    }),
    component: ITHygieneUsersInventoryGroups,
  },
];

export const ITHygieneUsersInventory = () => {
  return <ModuleSubTabs tabs={tabs} />;
};
