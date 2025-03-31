import React from 'react';
import { localStorageDataGridStateManagement } from './local-storage-data-grid-state-management';
import { DataGridState } from './types';

const useDataGridStateManagement = () => {
  const columnsPersistence = localStorageDataGridStateManagement;

  const getColumnsState = (
    moduleId: string,
  ): DataGridState['columns'] | null => {
    return columnsPersistence.getColumnsState(moduleId);
  };

  const setColumnsState = (
    moduleId: string,
    columns: DataGridState['columns'],
  ): void => {
    columnsPersistence.setColumnsState(moduleId, columns);
  };

  const getPageSize = (moduleId: string): number => {
    return columnsPersistence.getPageSize(moduleId);
  };

  const setPageSize = (
    moduleId: string,
    pageSize: DataGridState['pageSize'],
  ) => {
    columnsPersistence.setPageSize(moduleId, pageSize);
  };

  const resetState = (moduleId: string) => {
    columnsPersistence.resetState(moduleId);
  };

  return {
    getColumnsState,
    setColumnsState,
    getPageSize,
    setPageSize,
    resetState,
  };
};

export default useDataGridStateManagement;
