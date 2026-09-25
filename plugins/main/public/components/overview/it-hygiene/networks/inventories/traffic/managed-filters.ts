import { i18n } from '@osd/i18n';

export default [
  {
    type: 'multiSelectInput',
    key: 'source.port',
    placeholder: i18n.translate(
      'wazuh.itHygiene.trafficFilters.sourcePort.placeholder',
      { defaultMessage: 'Source port' },
    ),
    validate: value =>
      !value || /^\d+$/.test(value)
        ? undefined
        : i18n.translate(
            'wazuh.itHygiene.trafficFilters.sourcePort.validationError',
            { defaultMessage: 'Only numbers are allowed' },
          ),
  },
  {
    type: 'multiSelectInput',
    key: 'destination.port',
    placeholder: i18n.translate(
      'wazuh.itHygiene.trafficFilters.destinationPort.placeholder',
      { defaultMessage: 'Destination port' },
    ),
    validate: value =>
      !value || /^\d+$/.test(value)
        ? undefined
        : i18n.translate(
            'wazuh.itHygiene.trafficFilters.destinationPort.validationError',
            { defaultMessage: 'Only numbers are allowed' },
          ),
  },
  {
    type: 'multiSelect',
    key: 'network.transport',
    placeholder: i18n.translate(
      'wazuh.itHygiene.trafficFilters.transportProtocol.placeholder',
      { defaultMessage: 'Transport protocol' },
    ),
  },
  {
    type: 'multiSelect',
    key: 'process.name',
    placeholder: i18n.translate(
      'wazuh.itHygiene.trafficFilters.processName.placeholder',
      { defaultMessage: 'Process name' },
    ),
  },
];
