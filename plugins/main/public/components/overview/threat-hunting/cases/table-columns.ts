import { commonColumns } from '../../common/data-grid-columns';

export default [
  commonColumns.timestamp,
  commonColumns['wazuh.agent.name'],
  { id: 'wazuh.case.user.name', initialWidth: 170 },
  { id: 'wazuh.case.status', initialWidth: 170 },
  { id: 'wazuh.case.tags', initialWidth: 200 },
  { id: 'wazuh.case.comment' },
];
