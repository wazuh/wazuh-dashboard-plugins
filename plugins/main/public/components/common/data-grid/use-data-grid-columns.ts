import React, { useState } from 'react';
import { tDataGridColumn } from './types';
import useDataGridStateManagement from './data-grid-state-persistence/use-data-grid-state-management';

interface useDataGridColumnsProps {
  moduleId: string;
  defaultColumns: tDataGridColumn[];
  columnDefinitions: tDataGridColumn[];
}

function useDataGridColumns({
  moduleId,
  defaultColumns,
  columnDefinitions,
}: useDataGridColumnsProps) {
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() =>
    defaultColumns.map(({ id }) => id),
  );
  const { getColumnsState, setColumnsState } = useDataGridStateManagement();

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

  const setVisibleColumnsHandler = (columns: string[]) => {
    setVisibleColumns(columns);
    // persist in the local storage the columns selected
    const columnsToPersist = columns
      .map(columnId => {
        const column = columnDefinitions.find(({ id }) => id === columnId);
        return column ? column : null;
      })
      .filter(column => column !== null);
    setColumnsState(moduleId, columnsToPersist);
  };

  return {
    columnsAvailable: orderFirstMatchedColumns(
      columnDefinitions,
      visibleColumns,
    ), // This is a custom property used by the Available fields and is not part of EuiDataGrid component specification
    columns: visibleColumns.map(columnId =>
      columnDefinitions.find(({ id }) => id === columnId),
    ),
    columnVisibility: {
      visibleColumns,
      setVisibleColumns: setVisibleColumnsHandler,
    },
    getColumnsState: () => {
      const persistedColumns = getColumnsState(moduleId);
      if (!persistedColumns) return null;
      const persistedColumnIds = persistedColumns.map(({ id }) => id);
      setVisibleColumns(persistedColumnIds);
      return persistedColumns;
    },
  };
}

export default useDataGridColumns;
