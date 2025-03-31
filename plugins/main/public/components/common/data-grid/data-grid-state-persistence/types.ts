import { tDataGridColumn } from '../types';
import { KeyState } from './constants';

export interface DataGridState {
  columns: tDataGridColumn[];
  pageSize: number;
}

export interface DataGridStateManagement<
  T extends DataGridState[keyof DataGridState],
> {
  retrieveState: (moduleId: string) => T | null;
  persistState: (moduleId: string, payload: T) => void;
  clearState: (moduleId: string) => void;
}
