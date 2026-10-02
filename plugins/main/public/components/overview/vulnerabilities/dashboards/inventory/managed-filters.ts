import { i18n } from '@osd/i18n';

export default [
  {
    type: 'multiSelect',
    key: 'vulnerability.id',
    placeholder: i18n.translate(
      'wazuh.vulnerabilityDetection.inventoryFilters.cves.placeholder',
      {
        defaultMessage: 'CVEs',
      },
    ),
  },
  {
    type: 'multiSelect',
    key: 'vulnerability.severity',
    placeholder: i18n.translate(
      'wazuh.vulnerabilityDetection.inventoryFilters.severity.placeholder',
      {
        defaultMessage: 'Severity',
      },
    ),
  },
  {
    type: 'multiSelect',
    key: 'package.name',
    placeholder: i18n.translate(
      'wazuh.vulnerabilityDetection.inventoryFilters.packageName.placeholder',
      {
        defaultMessage: 'Package name',
      },
    ),
  },
];
