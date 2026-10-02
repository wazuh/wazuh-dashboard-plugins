import { i18n } from '@osd/i18n';

export default [
  {
    type: 'multiSelect',
    key: 'registry.path',
    placeholder: i18n.translate(
      'wazuh.fileIntegrityMonitoring.registryKeysFilters.pathPlaceholder',
      {
        defaultMessage: 'Path',
      },
    ),
  },
  {
    type: 'multiSelect',
    key: 'registry.owner',
    placeholder: i18n.translate(
      'wazuh.fileIntegrityMonitoring.registryKeysFilters.ownerPlaceholder',
      {
        defaultMessage: 'Owner',
      },
    ),
  },
  {
    type: 'multiSelect',
    key: 'registry.group',
    placeholder: i18n.translate(
      'wazuh.fileIntegrityMonitoring.registryKeysFilters.groupPlaceholder',
      {
        defaultMessage: 'Group',
      },
    ),
  },
];
