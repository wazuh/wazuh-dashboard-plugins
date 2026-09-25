import { i18n } from '@osd/i18n';
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
    name: i18n.translate('wazuh.itHygiene.packagesInventory.tabs.packages', {
      defaultMessage: 'Packages',
    }),
    component: ITHygienePackagesInventoryPackages,
  },
  {
    id: 'hotfixes',
    name: i18n.translate('wazuh.itHygiene.packagesInventory.tabs.windowsKbs', {
      defaultMessage: 'Windows KBs',
    }),
    component: ITHygienePackagesInventoryHotfixes,
  },
  {
    id: 'browser-extensions',
    name: i18n.translate(
      'wazuh.itHygiene.packagesInventory.tabs.browserExtensions',
      { defaultMessage: 'Browser extensions' },
    ),
    component: ITHygienePackagesInventoryWebBrowsers,
  },
];

export const ITHygienePackagesInventory = () => {
  return <ModuleSubTabs tabs={tabs} />;
};
