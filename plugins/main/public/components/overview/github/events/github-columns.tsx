import { tDataGridColumn } from '../../../common/data-grid';
import { commonColumns } from "../../common/data-grid-columns";

export const githubColumns: tDataGridColumn[] = [
  commonColumns.timestamp,
  commonColumns["agent.id"],
  {
    id: 'data.github.repo',
    initialWidth: 200,
  },
  {
    id: 'data.github.actor',
    initialWidth: 200,
  },
  {
    id: 'data.github.org',
    initialWidth: 200,
  },
  commonColumns["rule.description"],
  commonColumns["rule.level"],
  commonColumns["rule.id"],
];
