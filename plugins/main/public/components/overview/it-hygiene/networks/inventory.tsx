import { i18n } from '@osd/i18n';
import React from 'react';
import {
  ITHygieneNetworksInventoryInterfaces,
  ITHygieneNetworksInventoryNetworks,
  ITHygieneNetworksInventoryProtocols,
  ITHygieneNetworksInventoryServices,
  ITHygieneNetworksInventoryTraffic,
} from './inventories';
import { ModuleSubTabs } from '../../../common/tabs';

const tabs = [
  {
    id: 'networks',
    name: i18n.translate('wazuh.itHygiene.networksInventory.tabs.addresses', {
      defaultMessage: 'Addresses',
    }),
    component: ITHygieneNetworksInventoryNetworks,
  },
  {
    id: 'interfaces',
    name: i18n.translate('wazuh.itHygiene.networksInventory.tabs.interfaces', {
      defaultMessage: 'Interfaces',
    }),
    component: ITHygieneNetworksInventoryInterfaces,
  },
  {
    id: 'protocols',
    name: i18n.translate('wazuh.itHygiene.networksInventory.tabs.protocols', {
      defaultMessage: 'Protocols',
    }),
    component: ITHygieneNetworksInventoryProtocols,
  },
  {
    id: 'listeners',
    name: i18n.translate('wazuh.itHygiene.networksInventory.tabs.listeners', {
      defaultMessage: 'Listeners',
    }),
    component: ITHygieneNetworksInventoryServices,
  },
  {
    id: 'traffic',
    name: i18n.translate('wazuh.itHygiene.networksInventory.tabs.traffic', {
      defaultMessage: 'Traffic',
    }),
    component: ITHygieneNetworksInventoryTraffic,
  },
];

export const ITHygieneNetworksInventory = () => {
  return <ModuleSubTabs tabs={tabs} />;
};
