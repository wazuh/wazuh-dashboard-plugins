import { i18n } from '@osd/i18n';

export default [
  {
    type: 'multiSelect',
    key: 'registry.path',
    placeholder: i18n.translate(
      'wazuh.fileIntegrityMonitoring.registryValuesFilters.pathPlaceholder',
      {
        defaultMessage: 'Path',
      },
    ),
  },
  {
    type: 'multiSelect',
    key: 'registry.value',
    placeholder: i18n.translate(
      'wazuh.fileIntegrityMonitoring.registryValuesFilters.valuePlaceholder',
      {
        defaultMessage: 'Value',
      },
    ),
  },
  {
    type: 'multiSelect',
    key: 'registry.data.type',
    placeholder: i18n.translate(
      'wazuh.fileIntegrityMonitoring.registryValuesFilters.dataTypePlaceholder',
      {
        defaultMessage: 'Data type',
      },
    ),
  },
];
