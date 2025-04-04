import { useEffect, useState, useCallback } from 'react';
import { tDataGridColumn } from './types';
import useDataGridStateManagement from './data-grid-state-persistence/use-data-grid-state-management';
import { DataGridState } from './data-grid-state-persistence/types';
import { localStorageColumnsStateManagement } from './data-grid-state-persistence/local-storage-columns-state-management';

interface UseDataGridColumnsProps {
  appId: string;
  defaultColumns: EuiDataGridColumn[];
  columnDefinitions: tDataGridColumn[];
  allColumns: Set<string>;
}

export interface DataGridColumnsReturn {
  columnsAvailable: tDataGridColumn[];
  columns: EuiDataGridProps['columns'];
  columnVisibility: EuiDataGridProps['columnVisibility'];
  onColumnResize: EuiDataGridProps['onColumnResize'];
}

function useDataGridColumns({
  appId,
  defaultColumns,
  columnDefinitions,
  allColumns,
}: UseDataGridColumnsProps) {
  const defaultColumnsIds = defaultColumns.map(column => column.id) || [];
  const [visibleColumns, setVisibleColumns] =
    useState<string[]>(defaultColumnsIds);
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
          columnStateManagement.persistState(appId, defaultColumnsIds);
          setVisibleColumns(defaultColumnsIds);
        } catch (resetError) {
          console.error('Failed to reset columns to defaults:', resetError);
        }
      }
    }
  }, [appId, JSON.stringify([...allColumns])]);

  const sortFirstMatchedColumns = (
    firstMatchedColumns: tDataGridColumn[],
    visibleColumnsOrdered: string[],
  ) => {
    firstMatchedColumns.sort(
      (a, b) =>
        visibleColumnsOrdered.indexOf(a.id) -
        visibleColumnsOrdered.indexOf(b.id),
    );

    return firstMatchedColumns;
  };

  const orderFirstMatchedColumns = (
    columns: tDataGridColumn[],
    visibleColumnsOrdered: string[],
  ) => {
    const firstMatchedColumns: tDataGridColumn[] = [];
    const nonMatchedColumns: tDataGridColumn[] = [];
    const visibleColumnsSet = new Set(visibleColumnsOrdered);

    for (const column of columns) {
      if (visibleColumnsSet.has(column.id)) {
        firstMatchedColumns.push(column);
      } else {
        nonMatchedColumns.push(column);
      }
    }

    return [
      ...sortFirstMatchedColumns(firstMatchedColumns, visibleColumnsOrdered),
      ...nonMatchedColumns,
    ];
  };

  useEffect(() => {
    try {
      const persistedColumns = columnStateManagement.retrieveState(appId);

      if (!persistedColumns || persistedColumns.length === 0) {
        return;
      }

      setVisibleColumnsHandler(persistedColumns);
    } catch (error) {
      console.error('Error loading persisted columns:', error);
      setVisibleColumnsHandler(defaultColumnsIds);
    }
  }, [appId, JSON.stringify([...allColumns])]);

  return {
    // This is a custom property used by the Available fields and is not part of EuiDataGrid component specification
    columnsAvailable: orderFirstMatchedColumns(
      columnDefinitions,
      visibleColumns,
    ),
    columns: visibleColumns.map(columnId =>
      columnDefinitions.find(({ id }) => id === columnId),
    ),
    columnVisibility: {
      visibleColumns,
      setVisibleColumns: setVisibleColumnsHandler,
    },
  } satisfies DataGridColumnsReturn;
}

export default useDataGridColumns;
