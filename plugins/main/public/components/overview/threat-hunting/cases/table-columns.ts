import { commonColumns } from '../../common/data-grid-columns';

export default [
  commonColumns.timestamp,
  commonColumns['wazuh.agent.name'],
  { id: 'wazuh.case.status' },
  { id: 'wazuh.case.user.name' },
  { id: 'wazuh.case.tags' },
  { id: 'wazuh.case.updated_at' },
  { id: 'wazuh.case.comment' },
];
