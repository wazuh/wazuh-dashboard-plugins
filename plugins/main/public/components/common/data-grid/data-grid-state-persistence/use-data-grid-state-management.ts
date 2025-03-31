import React from 'react';
import { localStorageDataGridStateManagement } from './local-storage-data-grid-state-management';
import { DataGridState, DataGridStateManagement } from './types';

const useDataGridStateManagement = (
  stateManagement: DataGridStateManagement,
) => {
  const retrieveColumnsState = (
    moduleId: string,
  ): DataGridState['columns'] | null => {
    return stateManagement.retrieveColumnsState(moduleId);
  };

  const persistColumnsState = (
    moduleId: string,
    columns: DataGridState['columns'],
  ): void => {
    stateManagement.persistColumnsState(moduleId, columns);
  };

  const retrievePageSize = (moduleId: string): number => {
    return stateManagement.retrievePageSize(moduleId);
  };

  const persistPageSize = (
    moduleId: string,
    pageSize: DataGridState['pageSize'],
  ) => {
    stateManagement.persistPageSize(moduleId, pageSize);
  };

  const cleanState = (moduleId: string) => {
    stateManagement.cleanState(moduleId);
  };

  return {
    retrieveColumnsState,
    persistColumnsState,
    retrievePageSize,
    persistPageSize,
    cleanState,
  };
};

export default useDataGridStateManagement;
