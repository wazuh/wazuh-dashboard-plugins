import { i18n } from '@osd/i18n';

export default [
  {
    type: 'multiSelect',
    key: 'user.name',
    placeholder: i18n.translate(
      'wazuh.itHygiene.usersFilters.name.placeholder',
      { defaultMessage: 'Name' },
    ),
  },
  {
    type: 'multiSelect',
    key: 'user.groups',
    placeholder: i18n.translate(
      'wazuh.itHygiene.usersFilters.group.placeholder',
      { defaultMessage: 'Group' },
    ),
  },
  {
    type: 'multiSelect',
    key: 'user.shell',
    placeholder: i18n.translate(
      'wazuh.itHygiene.usersFilters.shell.placeholder',
      { defaultMessage: 'Shell' },
    ),
  },
];
