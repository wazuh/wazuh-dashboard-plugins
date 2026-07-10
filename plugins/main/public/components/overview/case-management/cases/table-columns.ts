import { commonColumns } from '../../common/data-grid-columns';

export default [
  commonColumns.timestamp,
  commonColumns['wazuh.agent.name'],
  { id: 'wazuh.case.title', initialWidth: 250 },
  { id: 'wazuh.case.status', initialWidth: 180 },
  { id: 'wazuh.case.severity', initialWidth: 150 },
  { id: 'wazuh.case.priority', initialWidth: 150 },
  { id: 'wazuh.case.tags', initialWidth: 200 },
  { id: 'wazuh.case.user.name', initialWidth: 190 },
];
