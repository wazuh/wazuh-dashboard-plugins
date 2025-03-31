import { DEFAULT_PAGE_SIZE } from '../constants';
import { buildKey } from './build-key';
import { KeyState } from './constants';
import { DataGridState, DataGridStateManagement } from './types';

type DataGridColumns = DataGridState['columns'];

// This file contains the implementation of the DataGridStateManagement interface
// using localStorage as the storage mechanism. It provides methods to
// retrieve and persist the state of the data grid columns.
// The state is stored in localStorage with a unique key based on the moduleId
// and the type of state.
// The state is stored in JSON format, and the methods handle parsing and
// stringifying the data as needed. The retrieve methods return the parsed
// state, while the persist methods store the state as a string in localStorage.
// The clearState method removes the stored state for the given moduleId.
export const localStorageColumnsStateManagement: DataGridStateManagement<DataGridColumns> =
  {
    retrieveState(moduleId: string) {
      const state = localStorage.getItem(buildKey(moduleId, KeyState.COLUMN));
      if (state) {
        try {
          return JSON.parse(state) as DataGridColumns;
        } catch {
          return [];
        }
      }
      return [];
    },

    persistState(moduleId: string, columns: DataGridColumns) {
      localStorage.setItem(
        buildKey(moduleId, KeyState.COLUMN),
        JSON.stringify(columns),
      );
    },

    clearState(moduleId: string) {
      localStorage.removeItem(buildKey(moduleId, KeyState.COLUMN));
    },
  };
