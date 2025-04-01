import { useEffect, useState, useCallback } from 'react';
import useDataGridStateManagement from './data-grid-state-persistence/use-data-grid-state-management';
import { DataGridState } from './data-grid-state-persistence/types';
import { localStorageColumnsStateManagement } from './data-grid-state-persistence/local-storage-columns-state-management';

interface UseDataGridColumnsProps {
  appId: string;
  defaultColumns: string[];
  allColumns: Set<string>;
}

function useDataGridColumns({
  appId,
  defaultColumns,
  allColumns,
}: UseDataGridColumnsProps) {
  const [visibleColumns, setVisibleColumns] =
    useState<string[]>(defaultColumns);
  // Fix potential circular dependency with columnStateManagement
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
      if (allColumns && allColumns.size > 0) {
        for (const columnId of columnsIds) {
          // Skip columns without ID (shouldn't happen, but for safety)
          if (!columnId) {
            continue;
          }

          if (!allColumns.has(columnId)) {
            throw new Error(
              `Column ${columnId} does not exist in column definitions`,
            );
            // Check if columns are unique
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
    [JSON.stringify([...allColumns])],
  );
  // Create state management with memoized validation function
  const columnStateManagement = useDataGridStateManagement<
    DataGridState['columns']
  >({
    stateManagement: localStorageColumnsStateManagement,
    defaultState: defaultColumns,
    validateState: validateColumns,
  });
  // Prevent infinite loop by checking if visibleColumns actually need updating
  const setVisibleColumnsHandler = useCallback(
    (columns: string[]) => {
      if (!allColumns || allColumns.size === 0) {
        return;
      }

      // Check if columns are the same as current visible columns
      const isSameColumns =
        columns.length === visibleColumns.length &&
        columns.every((col, index) => col === visibleColumns[index]);

      if (isSameColumns) {
        return;
      }

      // Update visible columns
      setVisibleColumns(columns);

      // Filter and persist valid columns
      const columnsToPersist = columns
        .map(columnId => (allColumns.has(columnId) ? columnId : null))
        .filter(Boolean) // Remove falsy values
        .filter(column => column !== null)
        .filter(column => column !== undefined);

      columnStateManagement.persistState(appId, columnsToPersist);
    },
    [
      visibleColumns,
      JSON.stringify([...allColumns]),
      columnStateManagement,
      appId,
    ],
  );

  useEffect(() => {
    if (allColumns && allColumns.size > 0) {
      try {
        // Get current persisted state for validation
        const persistedColumns = columnStateManagement.retrieveState(appId);

        if (
          persistedColumns &&
          Array.isArray(persistedColumns) &&
          persistedColumns.length > 0
        ) {
          validateColumns(persistedColumns);
        }
      } catch (error) {
        console.error(
          'Column validation failed after allColumns changed:',
          error,
        );

        // If validation fails, reset to default columns
        try {
          columnStateManagement.persistState(appId, defaultColumns);
          setVisibleColumns(defaultColumns);
        } catch (resetError) {
          console.error('Failed to reset columns to defaults:', resetError);
        }
      }
    }
  }, [appId, JSON.stringify([...allColumns])]);

  useEffect(() => {
    try {
      const persistedColumns = columnStateManagement.retrieveState(appId);

      if (!persistedColumns || persistedColumns.length === 0) {
        return;
      }

      setVisibleColumnsHandler(persistedColumns);
    } catch (error) {
      console.error('Error loading persisted columns:', error);
      setVisibleColumnsHandler(defaultColumns);
    }
  }, [appId, JSON.stringify([...allColumns])]);

  return {
    columnVisibility: {
      visibleColumns,
      setVisibleColumns: setVisibleColumnsHandler,
    },
  };
}

export default useDataGridColumns;
