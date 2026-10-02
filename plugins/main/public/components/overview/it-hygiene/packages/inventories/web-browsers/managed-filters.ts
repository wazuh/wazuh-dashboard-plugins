import { i18n } from '@osd/i18n';

export default [
  {
    type: 'multiSelect',
    key: 'browser.name',
    placeholder: i18n.translate(
      'wazuh.itHygiene.browserExtensionsFilters.browserName.placeholder',
      { defaultMessage: 'Browser name' },
    ),
  },
  {
    type: 'multiSelect',
    key: 'package.name',
    placeholder: i18n.translate(
      'wazuh.itHygiene.browserExtensionsFilters.packageName.placeholder',
      { defaultMessage: 'Package name' },
    ),
  },
  {
    type: 'multiSelect',
    key: 'package.enabled',
    placeholder: i18n.translate(
      'wazuh.itHygiene.browserExtensionsFilters.enabled.placeholder',
      { defaultMessage: 'Enabled' },
    ),
  },
];
