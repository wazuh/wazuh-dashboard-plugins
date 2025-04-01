import { DEFAULT_PAGE_SIZE } from '../constants';
import { buildKey } from './build-key';
import { KEY_STATE } from './constants';
import { DataGridState, DataGridStateManagement } from './types';

type DataGridPageSize = DataGridState['pageSize'];

// This file contains the implementation of the DataGridStateManagement interface
// using localStorage as the storage mechanism. It provides methods to
// retrieve and persist the state of the data grid page size.
// The state is stored in localStorage with a unique key based on the moduleId
// and the type of state.
// The state is stored in JSON format, and the methods handle parsing and
// stringifying the data as needed. The retrieve methods return the parsed
// state, while the persist methods store the state as a string in localStorage.
// The clearState method removes the stored state for the given moduleId.
export const localStoragePageSizeStateManagement: DataGridStateManagement<DataGridPageSize> =
  {
    retrieveState(moduleId: string) {
      const state = localStorage.getItem(
        buildKey(moduleId, KEY_STATE.PAGE_SIZE),
      );

      if (state) {
        try {
          return JSON.parse(state) as DataGridPageSize;
        } catch {
          return DEFAULT_PAGE_SIZE;
        }
      }

      return DEFAULT_PAGE_SIZE;
    },

    persistState(moduleId: string, pageSize: DataGridPageSize) {
      localStorage.setItem(
        buildKey(moduleId, KEY_STATE.PAGE_SIZE),
        String(pageSize),
      );
    },

    clearState(moduleId: string) {
      localStorage.removeItem(buildKey(moduleId, KEY_STATE.PAGE_SIZE));
    },
  };
