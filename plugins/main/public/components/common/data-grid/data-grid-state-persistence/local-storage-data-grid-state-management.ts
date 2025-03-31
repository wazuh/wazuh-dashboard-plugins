import { DEFAULT_PAGE_SIZE } from '../constants';
import { buildKey } from './build-key';
import { DataGridState, DataGridStateManagement } from './types';

export const localStorageDataGridStateManagement: DataGridStateManagement = {
  retrieveColumnsState(moduleId: string) {
    const state = localStorage.getItem(buildKey(moduleId, 'column'));
    if (state) {
      return JSON.parse(state) as DataGridState['columns'];
    }
    return [];
  },

  persistColumnsState(moduleId: string, columns: DataGridState['columns']) {
    localStorage.setItem(buildKey(moduleId, 'column'), JSON.stringify(columns));
  },

  retrievePageSize(moduleId: string) {
    const state = localStorage.getItem(buildKey(moduleId, 'page-size'));
    if (state) {
      try {
        return JSON.parse(state) as DataGridState['pageSize'];
      } catch (err) {
        return DEFAULT_PAGE_SIZE;
      }
    }
    return DEFAULT_PAGE_SIZE;
  },

  persistPageSize(moduleId: string, pageSize: DataGridState['pageSize']) {
    localStorage.setItem(buildKey(moduleId, 'page-size'), String(pageSize));
  },

  clearState(moduleId: string) {
    localStorage.removeItem(buildKey(moduleId, 'column'));
    localStorage.removeItem(buildKey(moduleId, 'page-size'));
  },
};
