import { useEffect, useState } from 'react';
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
  const columnStateManagement = useDataGridStateManagement<
    DataGridState['columns']
  >({
    stateManagement: localStorageColumnsStateManagement,
    defaultState: defaultColumns,
    validateState(columns: DataGridState['columns']) {
      // columns.forEach(columnState => {
      //   const column = columnDefinitions.find(
      //     field => field.id === columnState.id,
      //   );
      //   if (!column) {
      //     throw new Error(
      //       `Column ${columnState.id} is not existing in index pattern`,
      //     );
      //   }
      // });
      // Check if columns are unique
      const uniqueColumnIds = new Set(columns.map(column => column.id));
      if (uniqueColumnIds.size !== columns.length) {
        throw new Error('Column IDs must be unique');
      }
      return true;
    },
  });

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
    columnStateManagement.persistState(moduleId, columnsToPersist);
  };

  useEffect(() => {
    console.log(visibleColumns);
    const persistedColumns = columnStateManagement.retrieveState(moduleId);
    if (!persistedColumns) return;
    const persistedColumnsIds = persistedColumns
      .map(({ id }) => id)
      // TypeError: Cannot read properties of undefined (reading 'hasOwnProperty')
      .filter(Boolean);
    if (persistedColumnsIds && Array.isArray(persistedColumnsIds)) {
      setVisibleColumns(persistedColumnsIds);
    }
  }, [moduleId]);

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
