import { DEFAULT_PAGE_SIZE } from '../constants';
import { buildKey } from './build-key';
import { DataGridState, DataGridStateManagement } from './types';

export const localStorageDataGridStateManagement: DataGridStateManagement = {
  getColumnsState(moduleId: string) {
    const state = localStorage.getItem(buildKey(moduleId, 'column'));
    if (state) {
      return JSON.parse(state) as DataGridState['columns'];
    }
    return [];
  },

  setColumnsState(moduleId: string, columns: DataGridState['columns']) {
    localStorage.setItem(buildKey(moduleId, 'column'), JSON.stringify(columns));
  },

  getPageSize(moduleId: string) {
    const state = localStorage.getItem(buildKey(moduleId, 'page-size'));
    if (state) {
      return JSON.parse(state) as DataGridState['pageSize'];
    }
    return DEFAULT_PAGE_SIZE;
  },

  setPageSize(moduleId: string, pageSize: DataGridState['pageSize']) {
    localStorage.setItem(buildKey(moduleId, 'page-size'), String(pageSize));
  },

  resetState(moduleId: string) {
    localStorage.removeItem(buildKey(moduleId, 'column'));
    localStorage.removeItem(buildKey(moduleId, 'page-size'));
  },
};
