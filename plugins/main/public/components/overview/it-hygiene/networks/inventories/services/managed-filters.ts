import { i18n } from '@osd/i18n';

export default [
  {
    type: 'multiSelectInput',
    key: 'source.port',
    placeholder: i18n.translate(
      'wazuh.itHygiene.listenersFilters.sourcePort.placeholder',
      { defaultMessage: 'Source port' },
    ),
    validate: value =>
      !value || /^\d+$/.test(value)
        ? undefined
        : i18n.translate(
            'wazuh.itHygiene.listenersFilters.sourcePort.validationError',
            { defaultMessage: 'Only numbers are allowed' },
          ),
  },
  {
    type: 'multiSelect',
    key: 'network.transport',
    placeholder: i18n.translate(
      'wazuh.itHygiene.listenersFilters.transportProtocol.placeholder',
      { defaultMessage: 'Transport protocol' },
    ),
  },
  {
    type: 'multiSelect',
    key: 'process.name',
    placeholder: i18n.translate(
      'wazuh.itHygiene.listenersFilters.processName.placeholder',
      { defaultMessage: 'Process name' },
    ),
  },
];
