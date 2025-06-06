import { useEffect, useState, useCallback } from 'react';
import { EuiDataGridColumn, EuiDataGridProps } from '@elastic/eui';
import { tDataGridColumn } from './types';
import useDataGridStatePersistenceManager from './data-grid-state-persistence-manager/use-data-grid-state-persistence-manager';

interface UseDataGridColumnsProps {
  moduleId: string;
  defaultColumns: EuiDataGridColumn[];
  columnSchemaDefinitionsMap: Record<string, tDataGridColumn>;
  indexPatternExists: boolean;
  dataGridStatePersistenceManager: ReturnType<
    typeof useDataGridStatePersistenceManager
  >;
}

export interface DataGridColumnsReturn {
  columnsAvailable: tDataGridColumn[];
  columns: EuiDataGridProps['columns'];
  columnVisibility: EuiDataGridProps['columnVisibility'];
  onColumnResize: EuiDataGridProps['onColumnResize'];
}

function useDataGridColumns({
  moduleId,
  defaultColumns,
  columnSchemaDefinitionsMap,
  indexPatternExists,
  dataGridStatePersistenceManager,
}: UseDataGridColumnsProps) {
  const defaultColumnsIds: string[] =
    defaultColumns.map(column => column.id as string) || [];
  const [visibleColumns, setVisibleColumns] =
    useState<string[]>(defaultColumnsIds);

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

      dataGridStatePersistenceManager.updateState({
        columns: columnsToPersist,
      });
    },
    [
      visibleColumns,
      indexPatternExists,
      dataGridStatePersistenceManager,
      moduleId,
    ],
  );

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
    if (!indexPatternExists) {
      return;
    }

    try {
      const persistedColumns = dataGridStatePersistenceManager.state.columns;

      if (!persistedColumns || persistedColumns.length === 0) {
        return;
      }

      setVisibleColumnsHandler(persistedColumns);
    } catch (error) {
      console.error('Error loading persisted columns:', error);
      setVisibleColumnsHandler(defaultColumnsIds);
    }
    // I need AllColumns to trigger updates when it changes, because when I retrieve the persisted column state, I need to verify that those persisted columns actually exist within the columns defined in the Index Pattern. That’s why I need both.
  }, [moduleId, indexPatternExists]);

  // New effect to sync state changes with visible columns
  useEffect(() => {
    if (!indexPatternExists || !dataGridStatePersistenceManager.state.columns) {
      return;
    }

    const stateColumns = dataGridStatePersistenceManager.state.columns;

    // Check if state columns are different from current visible columns
    const isDifferent =
      stateColumns.length !== visibleColumns.length ||
      stateColumns.some((col, index) => col !== visibleColumns[index]);

    if (isDifferent) {
      setVisibleColumns(stateColumns);
    }
  }, [dataGridStatePersistenceManager.state.columns, indexPatternExists]);

  const onColumnResize: EuiDataGridProps['onColumnResize'] = ({
    columnId,
    width,
  }) => {
    const column = columnSchemaDefinitionsMap[columnId];

    if (column) {
      const currentWidths = dataGridStatePersistenceManager.state.columnWidths;

      dataGridStatePersistenceManager.updateState({
        columnWidths: {
          ...currentWidths,
          [columnId]: width,
        },
      });
    }
  };

  // Don't use `useMemo` here because otherwise the DataGrid cell filter doesn't work
  const retrieveVisibleDataGridColumns = visibleColumns.map(
    (columnId: string) => {
      let column = { ...columnSchemaDefinitionsMap[columnId] };
      const savedColumnWidth =
        dataGridStatePersistenceManager.state.columnWidths?.[columnId];

      if (savedColumnWidth) {
        column.initialWidth = savedColumnWidth;
      }

      return column;
    },
  );

  return {
    // This is a custom property used by the Available fields and is not part of EuiDataGrid component specification
    columnsAvailable: orderFirstMatchedColumns(
      Object.values(columnSchemaDefinitionsMap),
      visibleColumns,
    ),
    columns: retrieveVisibleDataGridColumns,
    columnVisibility: {
      visibleColumns,
      setVisibleColumns: setVisibleColumnsHandler,
    },
    onColumnResize,
  };
}

export default useDataGridColumns;
