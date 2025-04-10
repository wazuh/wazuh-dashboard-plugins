import { useCallback } from 'react';
import { DEFAULT_PAGE_SIZE } from '../constants';
import { DataGridState, DataGridStatePersistenceManager } from './types';

const MINIMUM_COLUMN_WIDTH = 40;
const MAXIMUM_COLUMN_WIDTH = 1000;

interface UseDataGridStateManagementProps {
  stateManagement: ReturnType<DataGridStatePersistenceManager<DataGridState>>;
  defaultState: DataGridState;
  columnSchemaDefinitionsMap: Record<string, unknown>;
}

const useDataGridStatePersistenceManager = ({
  stateManagement,
  defaultState,
  columnSchemaDefinitionsMap,
}: UseDataGridStateManagementProps) => {
  const validateColumns = useCallback(
    (columnsIds: DataGridState['columns']) => {
      // Avoid validation if we have no columns to validate
      if (
        !columnsIds ||
        !Array.isArray(columnsIds) ||
        columnsIds.length === 0
      ) {
        return true;
      }

      // Only perform column existence validation if allColumns is initialized and has items
      if (
        columnSchemaDefinitionsMap &&
        Object.keys(columnSchemaDefinitionsMap).length > 0
      ) {
        for (const columnId of columnsIds) {
          // Skip columns without ID (shouldn't happen, but for safety)
          if (!columnId) {
            continue;
          }

          if (columnSchemaDefinitionsMap[columnId] === undefined) {
            throw new Error(
              `Column ${columnId} does not exist in column definitions`,
            );
          }
        }
      }

      // Check if columns are unique
      const uniqueColumnIds = new Set(columnsIds.filter(Boolean));

      if (uniqueColumnIds.size !== columnsIds.length) {
        throw new Error('Column IDs must be unique');
      }

      return true;
    },
    // Create state management with memoized validation function
    [JSON.stringify(columnSchemaDefinitionsMap)],
  );

  const validateColumnsState = (columnIds: DataGridState['columns']) => {
    // Validate that the state is an array
    if (!Array.isArray(columnIds)) {
      throw new TypeError('Invalid state: expected an array');
    }

    // Validate that all elements in the state are strings
    for (const columnId of columnIds) {
      if (typeof columnId !== 'string') {
        throw new TypeError(`Invalid column ID: ${columnId}`);
      }

      // Check the length of the column ID
      if (columnId.length === 0) {
        throw new Error(`Invalid column ID: ${columnId}`);
      }
    }

    return validateColumns(columnIds);
  };

  const validateColumnWidthsState = (
    columnsWidth: DataGridState['columnsWidth'],
  ) => {
    // Validate that the state is an object
    if (typeof columnsWidth !== 'object' || columnsWidth === null) {
      throw new Error('Invalid state: expected an object');
    }

    // Validate that all keys in the state are valid column IDs
    for (const columnId of Object.keys(columnsWidth)) {
      if (typeof columnId !== 'string') {
        throw new TypeError(`Invalid column ID: ${columnId}`);
      }

      // Check the length of the column ID
      if (columnId.length === 0) {
        throw new Error(`Invalid column ID: ${columnId}`);
      }
    }

    // Validate that the column widths are numbers
    for (const width of Object.values(columnsWidth)) {
      if (
        typeof width !== 'number' ||
        Number.isNaN(width) ||
        !Number.isFinite(width) ||
        width < MINIMUM_COLUMN_WIDTH ||
        width > MAXIMUM_COLUMN_WIDTH
      ) {
        throw new Error(`Invalid column width: ${width}`);
      }
    }

    const columnsIds = Object.keys(columnsWidth);

    // Validate that the column IDs exist in the column definitions
    return validateColumns(columnsIds);
  };

  const validatePageSizeState = (pageSize: DataGridState['pageSize']) => {
    if (
      typeof pageSize !== 'number' ||
      !Number.isInteger(pageSize) ||
      pageSize <= 0
    ) {
      throw new Error(
        `Invalid page size: ${pageSize}. Page size must be a positive integer.`,
      );
    }

    return true;
  };

  const validateState = (state: Partial<DataGridState>) => {
    // Validate that the state is an object
    if (typeof state !== 'object' || state === null) {
      throw new Error('Invalid state: expected an object');
    }

    return true;
  };

  const clearState = () => {
    stateManagement.clearState();
  };

  const retrieveState = (): DataGridState => {
    const state: DataGridState = Object.assign(
      {},
      defaultState,
      stateManagement.retrieveState(),
    );
    let isValid = false;

    try {
      isValid = validateState(state) || false;
    } catch (error) {
      console.error('Error validating state:', error);
      clearState();
    }

    // Validate columns state separately to avoid clearing the entire state
    // if columns state is invalid
    // This is to avoid clearing the entire state if only columns are invalid
    // and to allow the rest of the state to be valid

    try {
      validateColumnsState(state.columns ?? []);
    } catch {
      state.columns = [];
      console.warn('Columns state was invalid, resetting to default.');
    }

    try {
      validateColumnWidthsState(state.columnsWidth ?? {});
    } catch {
      state.columnsWidth = {};
      console.warn('Columns width state was invalid, resetting to default.');
    }

    try {
      validatePageSizeState(state.pageSize ?? 0);
    } catch {
      state.pageSize = DEFAULT_PAGE_SIZE;
      console.warn('Page size state was invalid, resetting to default.');
    }

    if (isValid) {
      return state;
    }

    return defaultState;
  };

  const persistState = (payload: Partial<DataGridState>): void => {
    stateManagement.persistState(payload);
  };

  const updateState = (payload: Partial<DataGridState>): void => {
    const currentState = retrieveState();
    const newState = { ...currentState, ...payload };

    persistState(newState);
  };

  return {
    retrieveState,
    persistState,
    updateState,
    clearState,
  };
};

export default useDataGridStatePersistenceManager;
