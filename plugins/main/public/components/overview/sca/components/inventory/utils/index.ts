import { commonColumns } from '../../../../common/data-grid-columns';
import { scaI18n } from '../../../i18n';

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
    placeholder: scaI18n.filterPolicy,
  },
  {
    type: 'multiSelect',
    key: 'check.name',
    placeholder: scaI18n.filterCheck,
  },
];
