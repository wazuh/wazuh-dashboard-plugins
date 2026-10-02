import { i18n } from '@osd/i18n';

export default [
  {
    type: 'multiSelect',
    key: 'group.name',
    placeholder: i18n.translate(
      'wazuh.itHygiene.groupsFilters.name.placeholder',
      { defaultMessage: 'Name' },
    ),
  },
  {
    type: 'multiSelect',
    key: 'group.users',
    placeholder: i18n.translate(
      'wazuh.itHygiene.groupsFilters.user.placeholder',
      { defaultMessage: 'User' },
    ),
  },
];
