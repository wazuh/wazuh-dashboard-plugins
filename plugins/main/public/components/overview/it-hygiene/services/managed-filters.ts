import { i18n } from '@osd/i18n';

export default [
  {
    type: 'multiSelect',
    key: 'service.name',
    placeholder: i18n.translate(
      'wazuh.itHygiene.servicesFilters.name.placeholder',
      { defaultMessage: 'Name' },
    ),
  },
];
