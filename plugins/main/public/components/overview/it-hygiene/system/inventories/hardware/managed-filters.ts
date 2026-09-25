import { i18n } from '@osd/i18n';

export default [
  {
    type: 'multiSelect',
    key: 'host.cpu.name',
    placeholder: i18n.translate(
      'wazuh.itHygiene.hardwareFilters.cpuName.placeholder',
      { defaultMessage: 'CPU name' },
    ),
  },
  {
    type: 'multiSelectInput',
    key: 'host.cpu.cores',
    placeholder: i18n.translate(
      'wazuh.itHygiene.hardwareFilters.cpuCores.placeholder',
      { defaultMessage: 'CPU cores' },
    ),
    validate: value =>
      !value || /^\d+$/.test(value)
        ? undefined
        : i18n.translate(
            'wazuh.itHygiene.hardwareFilters.cpuCores.validationError',
            { defaultMessage: 'Only numbers are allowed' },
          ),
  },
];
