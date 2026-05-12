import { EuiDataGridColumn } from '@elastic/eui';
import { tDataGridColumn } from '../../../common/data-grid';
import { commonColumns } from '../../common/data-grid-columns';

export const MAX_ENTRIES_PER_QUERY = 10000;

const threatHuntingTableCommonColumns = {
  icon: {
    id: 'icon',
  },
  'wazuh.rule.mitre.id': {
    id: 'wazuh.rule.mitre.id',
    initialWidth: 123,
  },
  'wazuh.rule.mitre.tactic': {
    id: 'wazuh.rule.mitre.tactic',
    initialWidth: 266,
  },
} as Record<string, tDataGridColumn>;

export const threatHuntingTableDefaultColumns: tDataGridColumn[] = [
  threatHuntingTableCommonColumns.icon,
  commonColumns['wazuh.agent.id'],
  threatHuntingTableCommonColumns['wazuh.rule.mitre.id'],
  threatHuntingTableCommonColumns['wazuh.rule.mitre.tactic'],
  commonColumns['wazuh.rule.description'],
  commonColumns['wazuh.rule.level'],
  commonColumns['wazuh.rule.id'],
];

export const threatHuntingTableAgentColumns: EuiDataGridColumn[] = [
  threatHuntingTableCommonColumns.icon,
  commonColumns.timestamp,
  threatHuntingTableCommonColumns['wazuh.rule.mitre.id'],
  threatHuntingTableCommonColumns['wazuh.rule.mitre.tactic'],
  commonColumns['wazuh.rule.description'],
  commonColumns['wazuh.rule.level'],
  commonColumns['wazuh.rule.id'],
];
