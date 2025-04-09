import { buildKey } from './build-key';
import { DataGridState, DataGridStatePersistenceManager } from './types';

// This file contains the implementation of the DataGridStateManagement interface
// using localStorage as the storage mechanism. It provides methods to
// retrieve and persist the state of the data grid state.
// The state is stored in localStorage with a unique key based on the moduleId
// and the type of state.
// The state is stored in JSON format, and the methods handle parsing and
// stringifying the data as needed. The retrieve methods return the parsed
// state, while the persist methods store the state as a string in localStorage.
// The clearState method removes the stored state for the given moduleId.
export const localStorageStatePersistenceManager: DataGridStatePersistenceManager<DataGridState> =
  {
    retrieveState(moduleId: string) {
      const state = localStorage.getItem(buildKey(moduleId)) || '{}';

      if (state) {
        try {
          return JSON.parse(state) as DataGridState;
        } catch {
          return {};
        }
      }

      return {};
    },

    persistState(moduleId: string, payload: Partial<DataGridState>) {
      localStorage.setItem(buildKey(moduleId), JSON.stringify(payload));
    },

    clearState(moduleId: string) {
      localStorage.removeItem(buildKey(moduleId));
    },
  };
