import { i18n } from '@osd/i18n';

export default [
  {
    type: 'multiSelect',
    key: 'network.type',
    placeholder: i18n.translate(
      'wazuh.itHygiene.addressesFilters.networkType.placeholder',
      { defaultMessage: 'Network type' },
    ),
  },
  {
    type: 'multiSelectInput',
    key: 'network.ip',
    placeholder: i18n.translate(
      'wazuh.itHygiene.addressesFilters.ip.placeholder',
      { defaultMessage: 'IP' },
    ),
  },
  {
    type: 'multiSelect',
    key: 'interface.name',
    placeholder: i18n.translate(
      'wazuh.itHygiene.addressesFilters.interfaceName.placeholder',
      { defaultMessage: 'Interface name' },
    ),
  },
];
