import { i18n } from '@osd/i18n';

export default [
  {
    type: 'multiSelect',
    key: 'process.name',
    placeholder: i18n.translate(
      'wazuh.itHygiene.processesFilters.name.placeholder',
      { defaultMessage: 'Name' },
    ),
  },
  {
    type: 'multiSelect',
    key: 'process.command_line',
    placeholder: i18n.translate(
      'wazuh.itHygiene.processesFilters.commandLine.placeholder',
      { defaultMessage: 'Command line' },
    ),
  },
];
