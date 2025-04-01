import { useEffect, useState, useCallback } from 'react';
import { tDataGridColumn } from './types';
import { IndexPattern } from '../../../../../../src/plugins/data/public';
import useDataGridStateManagement from './data-grid-state-persistence/use-data-grid-state-management';
import { DataGridState } from './data-grid-state-persistence/types';
import { localStorageColumnsStateManagement } from './data-grid-state-persistence/local-storage-columns-state-management';

interface useDataGridColumnsProps {
  moduleId: string;
  defaultColumns: tDataGridColumn[];
  columnDefinitions: tDataGridColumn[];
  indexPattern: IndexPattern; // FIXME: delete this when the index pattern is not used
}

function useDataGridColumns({
  moduleId,
  defaultColumns,
  columnDefinitions,
}: useDataGridColumnsProps) {
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() =>
    defaultColumns.map(({ id }) => id),
  );

  // Fix potential circular dependency with columnStateManagement
  const validateColumns = useCallback(
    (columns: DataGridState['columns']) => {
      // Avoid validation if we have no columns to validate
      if (!columns || !Array.isArray(columns) || columns.length === 0) {
        return true;
      }

      // Only perform column existence validation if columnDefinitions is initialized and has items
      if (columnDefinitions && columnDefinitions.length > 0) {
        const columnDefinitionsIds = new Set(
          columnDefinitions.map(column => column.id),
        );
        for (const columnState of columns) {
          // Skip columns without ID (shouldn't happen, but for safety)
          if (!columnState || !columnState.id) continue;

          if (!columnDefinitionsIds.has(columnState.id)) {
            throw new Error(
              `Column ${columnState.id} does not exist in column definitions`,
            );
            // Check if columns are unique
          }
        }
      }

      // Check if columns are unique
      const uniqueColumnIds = new Set(
        columns.map(column => column?.id).filter(Boolean),
      );
      if (uniqueColumnIds.size !== columns.length) {
        throw new Error('Column IDs must be unique');
      }
      return true;
    },
    // Create state management with memoized validation function
    [columnDefinitions],
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
      if (
        columns.length !== visibleColumns.length ||
        !columns.every((col, index) => col === visibleColumns[index])
      ) {
        setVisibleColumns(columns);
        const columnsToPersist = columns
          .map(columnId => {
            const column = columnDefinitions.find(({ id }) => id === columnId);
            return column ? column : null;
          })
          .filter(column => column !== null);
        columnStateManagement.persistState(moduleId, columnsToPersist);
      }
    },
    [visibleColumns, columnDefinitions, columnStateManagement, moduleId],
  );

  useEffect(() => {
    if (columnDefinitions && columnDefinitions.length > 0) {
      try {
        // Get current persisted state for validation
        const persistedColumns = columnStateManagement.retrieveState(moduleId);
        if (
          persistedColumns &&
          Array.isArray(persistedColumns) &&
          persistedColumns.length > 0
        ) {
          validateColumns(persistedColumns);
        }
      } catch (error) {
        console.error(
          'Column validation failed after columnDefinitions changed:',
          error,
        );
        // If validation fails, reset to default columns
        try {
          columnStateManagement.persistState(moduleId, defaultColumns);
          setVisibleColumns(defaultColumns.map(({ id }) => id));
        } catch (resetError) {
          console.error('Failed to reset columns to defaults:', resetError);
        }
      }
    }
  }, [
    columnDefinitions,
    moduleId,
    validateColumns,
    columnStateManagement,
    defaultColumns,
  ]);

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

    for (let i = 0; i < columns.length; i++) {
      const column = columns[i];
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
      const persistedColumns = columnStateManagement.retrieveState(moduleId);
      if (!persistedColumns) return;
      const persistedColumnsIds = persistedColumns
        .map(column => column?.id)
        .filter(Boolean);
      if (
        persistedColumnsIds &&
        Array.isArray(persistedColumnsIds) &&
        persistedColumnsIds.length > 0
      ) {
        setVisibleColumnsHandler(persistedColumnsIds);
      }
    } catch (error) {
      console.error('Error loading persisted columns:', error);
      setVisibleColumnsHandler(defaultColumns.map(({ id }) => id));
    }
  }, [
    moduleId,
    columnStateManagement,
    defaultColumns,
    setVisibleColumnsHandler,
  ]);

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
  };
}

export default useDataGridColumns;
