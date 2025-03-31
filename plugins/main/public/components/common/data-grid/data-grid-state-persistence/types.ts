import { tDataGridColumn } from '../types';

export interface DataGridState {
  columns: tDataGridColumn[];
  pageSize: number;
}

export interface DataGridStateManagement {
  getColumnsState: (moduleId: string) => DataGridState['columns'] | null;
  setColumnsState: (
    moduleId: string,
    columns: DataGridState['columns'],
  ) => void;
  getPageSize: (moduleId: string) => number;
  setPageSize: (moduleId: string, pageSize: DataGridState['pageSize']) => void;
  resetState: (moduleId: string) => void;
}
