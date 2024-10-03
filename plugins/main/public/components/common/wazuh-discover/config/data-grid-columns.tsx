import { commonColumns } from "../../../overview/common/data-grid-columns";
import { tDataGridColumn } from '../../data-grid';

export const threatHuntingColumns: tDataGridColumn[] = [
  commonColumns.timestamp,
  commonColumns["agent.name"],
  commonColumns["rule.description"],
  commonColumns["rule.level"],
  commonColumns["rule.id"],
];
