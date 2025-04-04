import { useEffect, useState, useCallback, useMemo } from 'react';
import { EuiDataGridColumn, EuiDataGridProps } from '@elastic/eui';
import { tDataGridColumn } from './types';
import useDataGridStateManagement from './data-grid-state-persistence/use-data-grid-state-management';
import { DataGridState } from './data-grid-state-persistence/types';
import { localStorageColumnsStateManagement } from './data-grid-state-persistence/local-storage-columns-state-management';
import { localStorageColumnsWidthStateManagement } from './data-grid-state-persistence/local-storage-columns-width-state-management';

const MINIMUM_COLUMN_WIDTH = 40;
const MAXIMUM_COLUMN_WIDTH = 1000;

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
    defaultState: defaultColumnsIds,
    validateState: state => {
      // Validate that the state is an array
      if (!Array.isArray(state)) {
        throw new TypeError('Invalid state: expected an array');
      }

      // Validate that all elements in the state are strings
      for (const columnId of state) {
        if (typeof columnId !== 'string') {
          throw new TypeError(`Invalid column ID: ${columnId}`);
        }

        // Check the length of the column ID
        if (columnId.length === 0) {
          throw new Error(`Invalid column ID: ${columnId}`);
        }
      }

      return validateColumns(state);
    },
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const columnWidthStateManagement = useDataGridStateManagement<
    DataGridState['columnsWidth']
  >({
    stateManagement: localStorageColumnsWidthStateManagement,
    defaultState: {},
    validateState: state => {
      // Validate that the state is an object
      if (typeof state !== 'object' || state === null) {
        throw new Error('Invalid state: expected an object');
      }

      // Validate that all keys in the state are valid column IDs
      for (const columnId of Object.keys(state)) {
        if (typeof columnId !== 'string') {
          throw new TypeError(`Invalid column ID: ${columnId}`);
        }

        // Check the length of the column ID
        if (columnId.length === 0) {
          throw new Error(`Invalid column ID: ${columnId}`);
        }
      }

      // Validate that the column widths are numbers
      for (const width of Object.values(state)) {
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

      // Validate that the column IDs exist in the column definitions
      return validateColumns(Object.keys(state));
    },
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
    // I need AllColumns to trigger updates when it changes, because when I retrieve the persisted column state, I need to verify that those persisted columns actually exist within the columns defined in the Index Pattern. That’s why I need both.
  }, [appId, JSON.stringify([...allColumns])]);

  // Convert column definitions to Record<string, EuiDataGridColumn>
  const columnDefinitionsMap: Record<string, EuiDataGridColumn> = useMemo(
    () =>
      Object.fromEntries(columnDefinitions.map(column => [column.id, column])),
    [columnDefinitions],
  );

  const onColumnResize: EuiDataGridProps['onColumnResize'] = ({
    columnId,
    width,
  }) => {
    const column = columnDefinitionsMap[columnId];

    if (column) {
      column.initialWidth = width;
      columnWidthStateManagement.persistState(appId, {
        ...columnWidthStateManagement.retrieveState(appId),
        [columnId]: width,
      });
    }
  };

  const retrieveVisibleDataGridColumns = useMemo(
    (): EuiDataGridColumn[] =>
      visibleColumns.map(columnId => {
        const column = columnDefinitionsMap[columnId];
        const savedColumnWidth =
          columnWidthStateManagement.retrieveState(appId)[columnId];

        if (savedColumnWidth) {
          column.initialWidth = savedColumnWidth;
        }

        return column;
      }),
    [visibleColumns, JSON.stringify(columnDefinitionsMap), appId],
  );

  return {
    // This is a custom property used by the Available fields and is not part of EuiDataGrid component specification
    columnsAvailable: orderFirstMatchedColumns(
      columnDefinitions,
      visibleColumns,
    ),
    columns: retrieveVisibleDataGridColumns,
    columnVisibility: {
      visibleColumns,
      setVisibleColumns: setVisibleColumnsHandler,
    },
    onColumnResize,
  } satisfies DataGridColumnsReturn;
}

export default useDataGridColumns;
