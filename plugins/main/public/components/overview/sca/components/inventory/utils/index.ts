import { commonColumns } from '../../../../common/data-grid-columns';
import { i18n } from '@osd/i18n';

export const tableColumns = [
  commonColumns['wazuh.agent.name'],
  { id: 'policy.name' },
  { id: 'check.id', initialWidth: 100 },
  { id: 'check.name' },
  { id: 'check.result', initialWidth: 130 },
];

export const managedFilters = [
  {
    type: 'multiSelect',
    key: 'policy.name',
    placeholder: i18n.translate(
      'wazuh.configurationAssessment.inventoryFilters.policy',
      {
        defaultMessage: 'Policy',
      },
    ),
  },
  {
    type: 'multiSelect',
    key: 'check.name',
    placeholder: i18n.translate(
      'wazuh.configurationAssessment.inventoryFilters.check',
      {
        defaultMessage: 'Check',
      },
    ),
  },
];
