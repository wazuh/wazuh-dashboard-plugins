import { i18n } from '@osd/i18n';

export default [
  {
    type: 'multiSelect',
    key: 'package.hotfix.name',
    placeholder: i18n.translate(
      'wazuh.itHygiene.hotfixesFilters.kb.placeholder',
      { defaultMessage: 'KB' },
    ),
  },
];
