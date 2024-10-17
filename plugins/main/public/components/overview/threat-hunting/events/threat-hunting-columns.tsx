import { EuiDataGridColumn } from '@elastic/eui';
import { tDataGridColumn } from '../../../common/data-grid';
import { commonColumns } from '../../common/data-grid-columns';

export const MAX_ENTRIES_PER_QUERY = 10000;

const threatHuntingTableCommonColumns = {
  icon: {
    id: 'icon',
  },
  'rule.mitre.id': {
    id: 'rule.mitre.id',
    initialWidth: 123,
  },
  'rule.mitre.tactic': {
    id: 'rule.mitre.tactic',
    initialWidth: 266,
  },
} as Record<string, tDataGridColumn>;

export const threatHuntingTableDefaultColumns: tDataGridColumn[] = [
  threatHuntingTableCommonColumns.icon,
  commonColumns.timestamp,
  commonColumns['agent.id'],
  commonColumns['agent.name'],
  threatHuntingTableCommonColumns['rule.mitre.id'],
  threatHuntingTableCommonColumns['rule.mitre.tactic'],
  commonColumns['rule.description'],
  commonColumns['rule.level'],
  commonColumns['rule.id'],
];

export const threatHuntingTableAgentColumns: EuiDataGridColumn[] = [
  threatHuntingTableCommonColumns.icon,
  commonColumns.timestamp,
  threatHuntingTableCommonColumns['rule.mitre.id'],
  threatHuntingTableCommonColumns['rule.mitre.tactic'],
  commonColumns['rule.description'],
  commonColumns['rule.level'],
  commonColumns['rule.id'],
];
