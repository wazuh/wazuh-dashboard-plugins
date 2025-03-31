import { tDataGridColumn } from '../types';

export interface DataGridState {
  columns: tDataGridColumn[];
  pageSize: number;
}

export interface DataGridStateManagement {
  retrieveColumnsState: (moduleId: string) => DataGridState['columns'] | null;
  persistColumnsState: (
    moduleId: string,
    columns: DataGridState['columns'],
  ) => void;
  retrievePageSize: (moduleId: string) => number;
  persistPageSize: (
    moduleId: string,
    pageSize: DataGridState['pageSize'],
  ) => void;
  clearState: (moduleId: string) => void;
}
