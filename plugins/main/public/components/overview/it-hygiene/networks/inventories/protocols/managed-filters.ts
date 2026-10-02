import { i18n } from '@osd/i18n';

export default [
  {
    type: 'multiSelect',
    key: 'network.type',
    placeholder: i18n.translate(
      'wazuh.itHygiene.protocolsFilters.networkType.placeholder',
      { defaultMessage: 'Network type' },
    ),
  },
  {
    type: 'multiSelect',
    key: 'interface.name',
    placeholder: i18n.translate(
      'wazuh.itHygiene.protocolsFilters.interfaceName.placeholder',
      { defaultMessage: 'Interface name' },
    ),
  },
  {
    type: 'multiSelect',
    key: 'network.dhcp',
    placeholder: i18n.translate(
      'wazuh.itHygiene.protocolsFilters.dhcpEnabled.placeholder',
      { defaultMessage: 'DHCP enabled' },
    ),
  },
];
