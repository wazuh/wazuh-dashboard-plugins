import { i18n } from '@osd/i18n';

export default [
  {
    type: 'multiSelect',
    key: 'package.vendor',
    placeholder: i18n.translate(
      'wazuh.itHygiene.packagesFilters.vendor.placeholder',
      { defaultMessage: 'Vendor' },
    ),
  },
  {
    type: 'multiSelect',
    key: 'package.name',
    placeholder: i18n.translate(
      'wazuh.itHygiene.packagesFilters.name.placeholder',
      { defaultMessage: 'Name' },
    ),
  },
  {
    type: 'multiSelect',
    key: 'package.type',
    placeholder: i18n.translate(
      'wazuh.itHygiene.packagesFilters.type.placeholder',
      { defaultMessage: 'Type' },
    ),
  },
];
