import React from 'react';
import { tDataGridColumn } from '../../data-grid';

export const threatHuntingColumns: tDataGridColumn[] = [
  {
    id: 'timestamp',
    isSortable: true,
    defaultSortDirection: 'desc',
    initialWidth: 203.8,
  },
  {
    id: 'agent.name',
    initialWidth: 318.05,
  },
  {
    id: 'rule.description',
  },
  {
    id: 'rule.level',
    initialWidth: 93.05,
  },
  {
    id: 'rule.id',
    initialWidth: 93.05,
  },
];
