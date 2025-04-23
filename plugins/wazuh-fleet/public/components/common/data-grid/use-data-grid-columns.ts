import { useEffect, useState, useCallback, useMemo } from 'react';
import { EuiDataGridColumn, EuiDataGridProps } from '@elastic/eui';
import { DataGridColumn } from './types';
import useDataGridStatePersistenceManager from './data-grid-state-persistence-manager/use-data-grid-state-persistence-manager';
import { localStorageStatePersistenceManager } from './data-grid-state-persistence-manager/local-storage-state-persistence-manager';
import { DEFAULT_PAGE_SIZE, ALWAYS_VISIBLE_COLUMNS } from './constants';

interface UseDataGridColumnsProps {
  appId: string;
  defaultColumns: EuiDataGridColumn[];
  columnSchemaDefinitionsMap: Record<string, DataGridColumn>;
  indexPatternExists: boolean;
}

export interface DataGridColumnsReturn {
  columnsAvailable: DataGridColumn[];
  columns: EuiDataGridProps['columns'];
  columnVisibility: EuiDataGridProps['columnVisibility'];
  onColumnResize: EuiDataGridProps['onColumnResize'];
}

function useDataGridColumns({
  appId,
  defaultColumns,
  columnSchemaDefinitionsMap,
  indexPatternExists,
}: UseDataGridColumnsProps) {
  const defaultColumnsIds: string[] =
    defaultColumns.map(column => column.id as string) || [];
  const [visibleColumns, setVisibleColumns] =
    useState<string[]>(defaultColumnsIds);
  // Create state management with memoized validation function
  const dataGridStateManager = useDataGridStatePersistenceManager({
    stateManagement: localStorageStatePersistenceManager(appId),
    defaultState: {
      columns: defaultColumnsIds,
      columnWidths: {},
      pageSize: DEFAULT_PAGE_SIZE, // TODO: move this
    },
    columnSchemaDefinitionsMap,
    indexPatternExists,
  });
  // Prevent infinite loop by checking if visibleColumns actually need updating
  const setVisibleColumnsHandler = useCallback(
    (columns: string[]) => {
      if (
        !columnSchemaDefinitionsMap ||
        Object.keys(columnSchemaDefinitionsMap).length === 0
      ) {
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
        .map(columnId =>
          columnSchemaDefinitionsMap[columnId] === undefined ? null : columnId,
        )
        .filter(Boolean) // Remove falsy values
        .filter(column => column !== null)
        .filter(column => column !== undefined);

      dataGridStateManager.updateState({ columns: columnsToPersist });
    },
    [visibleColumns, indexPatternExists, dataGridStateManager, appId],
  );

  const sortFirstMatchedColumns = (
    firstMatchedColumns: DataGridColumn[],
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
    columns: DataGridColumn[],
    visibleColumnsOrdered: string[],
  ) => {
    const firstMatchedColumns: DataGridColumn[] = [];
    const nonMatchedColumns: DataGridColumn[] = [];
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
    if (!indexPatternExists) {
      return;
    }

    try {
      const persistedColumns = dataGridStateManager.retrieveState().columns;

      if (!persistedColumns || persistedColumns.length === 0) {
        return;
      }

      setVisibleColumnsHandler(persistedColumns);
    } catch (error) {
      console.error('Error loading persisted columns:', error);
      setVisibleColumnsHandler(defaultColumnsIds);
    }
    // I need AllColumns to trigger updates when it changes, because when I retrieve the persisted column state, I need to verify that those persisted columns actually exist within the columns defined in the Index Pattern. That’s why I need both.
  }, [appId, indexPatternExists]);

  const onColumnResize: EuiDataGridProps['onColumnResize'] = ({
    columnId,
    width,
  }) => {
    const column = columnSchemaDefinitionsMap[columnId];

    if (column) {
      const currentWidths = dataGridStateManager.retrieveState().columnWidths;

      dataGridStateManager.updateState({
        columnWidths: {
          ...currentWidths,
          [columnId]: width,
        },
      });
    }
  };

  const retrieveVisibleDataGridColumns = useMemo(
    (): EuiDataGridColumn[] =>
      visibleColumns.map((columnId: string) => {
        const column = { ...columnSchemaDefinitionsMap[columnId] };
        const savedColumnWidth =
          dataGridStateManager.retrieveState().columnWidths[columnId];

        if (savedColumnWidth) {
          column.initialWidth = savedColumnWidth;
        }

        return column;
      }),
    [visibleColumns, JSON.stringify(columnSchemaDefinitionsMap), appId],
  );

  const columnsAvailable = useMemo(() => {
    let excludedColumns: string[] = ALWAYS_VISIBLE_COLUMNS;

    return orderFirstMatchedColumns(
      Object.values(columnSchemaDefinitionsMap),
      visibleColumns,
    ).filter(column => !excludedColumns.includes(column.id));
  }, [columnSchemaDefinitionsMap, visibleColumns]);

  return {
    // This is a custom property used by the Available fields and is not part of EuiDataGrid component specification
    columnsAvailable,
    columns: retrieveVisibleDataGridColumns,
    columnVisibility: {
      visibleColumns,
      setVisibleColumns: setVisibleColumnsHandler,
    },
    onColumnResize,
  };
}

export default useDataGridColumns;
