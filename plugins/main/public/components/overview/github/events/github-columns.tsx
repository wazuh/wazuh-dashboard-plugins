import { tDataGridColumn } from '../../../common/data-grid';

export const githubColumns: tDataGridColumn[] = [
  {
    id: 'timestamp',
    isSortable: true,
    defaultSortDirection: 'desc',
  },
  {
    id: 'agent.id',
  },
  {
    id: 'data.github.repo',
  },
  {
    id: 'data.github.actor',
  },
  {
    id: 'data.github.org',
  },
  {
    id: 'rule.description',
  },
  {
    id: 'rule.level',
  },
  {
    id: 'rule.id',
  },
];
