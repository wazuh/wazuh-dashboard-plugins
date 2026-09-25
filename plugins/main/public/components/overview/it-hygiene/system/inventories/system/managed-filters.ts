import { i18n } from '@osd/i18n';

export default [
  {
    type: 'multiSelect',
    key: 'host.os.platform',
    placeholder: i18n.translate(
      'wazuh.itHygiene.systemFilters.platform.placeholder',
      { defaultMessage: 'Platform' },
    ),
  },
  {
    type: 'multiSelect',
    key: 'host.os.name',
    placeholder: i18n.translate(
      'wazuh.itHygiene.systemFilters.name.placeholder',
      { defaultMessage: 'Name' },
    ),
  },
  {
    type: 'multiSelect',
    key: 'host.architecture',
    placeholder: i18n.translate(
      'wazuh.itHygiene.systemFilters.architecture.placeholder',
      { defaultMessage: 'Architecture' },
    ),
  },
];
