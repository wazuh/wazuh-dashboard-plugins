import { i18n } from '@osd/i18n';

export default [
  {
    type: 'multiSelect',
    key: 'file.path',
    placeholder: i18n.translate(
      'wazuh.fileIntegrityMonitoring.filesFilters.pathPlaceholder',
      {
        defaultMessage: 'Path',
      },
    ),
  },
  {
    type: 'multiSelect',
    key: 'file.owner',
    placeholder: i18n.translate(
      'wazuh.fileIntegrityMonitoring.filesFilters.ownerPlaceholder',
      {
        defaultMessage: 'Owner',
      },
    ),
  },
];
