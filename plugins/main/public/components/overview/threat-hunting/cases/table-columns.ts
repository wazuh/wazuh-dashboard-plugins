import { commonColumns } from '../../common/data-grid-columns';

export default [
  commonColumns.timestamp,
  commonColumns['wazuh.agent.name'],
  { id: 'wazuh.case.user.name', initialWidth: 150 },
  { id: 'wazuh.case.status', initialWidth: 120 },
  { id: 'wazuh.case.tags', initialWidth: 150 },
  { id: 'wazuh.case.comment' },
];
