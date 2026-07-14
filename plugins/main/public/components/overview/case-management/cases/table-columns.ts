import { commonColumns } from '../../common/data-grid-columns';

export default [
  commonColumns.timestamp,
  commonColumns['wazuh.agent.name'],
  // WORKAROUND: this defines the isSortable that avoid this field can be sortable. This should be done using the field spec instead for an escalable remediation
  { id: 'wazuh.case.title', initialWidth: 250, isSortable: false },
  { id: 'wazuh.case.status', initialWidth: 180 },
  { id: 'wazuh.case.severity', initialWidth: 150 },
  { id: 'wazuh.case.priority', initialWidth: 150 },
  { id: 'wazuh.case.user.name', initialWidth: 190 },
  { id: 'wazuh.case.tags' },
];
