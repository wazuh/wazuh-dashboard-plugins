import { DEFAULT_PAGE_SIZE } from '../constants';
import { buildKey } from './build-key';
import { DataGridState, DataGridStateManagement } from './types';

// This file contains the implementation of the DataGridStateManagement interface
// using localStorage as the storage mechanism. It provides methods to
// retrieve and persist the state of the data grid columns and page size.
// The state is stored in localStorage with a unique key based on the moduleId
// and the type of state (column or page-size).
// The state is stored in JSON format, and the methods handle parsing and
// stringifying the data as needed. The retrieve methods return the parsed
// state, while the persist methods store the state as a string in localStorage.
// The clearState method removes the stored state for the given moduleId.
export const localStorageDataGridStateManagement: DataGridStateManagement = {
  retrieveColumnsState(moduleId: string) {
    const state = localStorage.getItem(buildKey(moduleId, 'column'));
    if (state) {
      try {
        return JSON.parse(state) as DataGridState['columns'];
      } catch {
        return [];
      }
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
      } catch {
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
