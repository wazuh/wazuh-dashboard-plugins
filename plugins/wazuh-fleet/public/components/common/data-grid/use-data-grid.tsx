import {
  EuiDataGridProps,
  EuiDataGridSorting,
  EuiDataGridColumn,
} from '@elastic/eui';
import React, { useEffect, useMemo, useState } from 'react';
import { SearchResponse } from '@opensearch-project/opensearch/api/types';
import dompurify from 'dompurify';
import { IndexPattern } from '../../../../../../src/plugins/data/common';
import {
  parseData,
  getFieldFormatted,
  parseColumns,
} from './data-grid-service';
import {
  DataGridColumn,
  DataGridRenderColumn,
  PaginationOptions,
} from './types';
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGINATION_OPTIONS,
  MAX_ENTRIES_PER_QUERY,
} from './constants';
import useDataGridColumns from './use-data-grid-columns';
import useDataGridStatePersistenceManager from './data-grid-state-persistence-manager/use-data-grid-state-persistence-manager';
import { localStorageStatePersistenceManager } from './data-grid-state-persistence-manager/local-storage-state-persistence-manager';

export interface DataGridProps {
  appId: string;
  indexPattern: IndexPattern;
  results: SearchResponse;
  defaultColumns: DataGridColumn[];
  renderColumns?: DataGridRenderColumn[];
  ariaLabelledBy: string;
  pagination?: Partial<EuiDataGridProps['pagination']>;
  leadingControlColumns?: EuiDataGridProps['leadingControlColumns'];
  trailingControlColumns?: EuiDataGridProps['trailingControlColumns'];
}

export const useDataGrid = (props: DataGridProps): EuiDataGridProps => {
  const {
    appId,
    indexPattern,
    results,
    defaultColumns,
    renderColumns,
    trailingControlColumns,
    pagination: defaultPagination,
    leadingControlColumns
  } = props;
  /** Rows */
  const [rows, setRows] = useState<any[]>([]);
  const rowCount = results ? (results?.hits?.total as number) : 0;

  /** Sorting **/
  // get default sorting from default columns
  const getDefaultSorting = () => {
    const defaultSort = defaultColumns.find(
      column => column.isSortable || column.defaultSortDirection,
    );

    return defaultSort
      ? [
        {
          id: defaultSort.id,
          direction: defaultSort.defaultSortDirection || 'desc',
        },
      ]
      : [];
  };

  const defaultSorting: EuiDataGridSorting['columns'] = getDefaultSorting();
  const [sortingColumns, setSortingColumns] = useState(defaultSorting);

  const onSort = (sortingColumns: EuiDataGridSorting['columns']) => {
    setSortingColumns(sortingColumns);
  };

  /** Pagination **/
  const [pagination, setPagination] = useState<PaginationOptions>({
    ...DEFAULT_PAGINATION_OPTIONS,
    ...defaultPagination,
  });
  const onChangePage = (pageIndex: number) =>
    setPagination(pagination => ({ ...pagination, pageIndex }));

  useEffect(() => {
    setRows(results?.hits?.hits || []);
  }, [results, results?.hits, results?.hits?.total]);

  useEffect(() => {
    setPagination(pagination => ({ ...pagination, pageIndex: 0 }));
  }, [rowCount]);

  const renderCellValue = ({
    rowIndex,
    columnId,
  }: {
    rowIndex: number;
    columnId: string;
  }) => {
    // Ensure rowsParsed is always an array
    const parsed = parseData(rows);
    const rowsParsed = Array.isArray(parsed) ? parsed : [];
    // On the context data always is stored the current page data (pagination)
    // then the rowIndex is relative to the current page
    const relativeRowIndex = rowIndex % pagination.pageSize;

    // Safer check for array index
    if (rowsParsed.length > relativeRowIndex && relativeRowIndex >= 0) {
      const fieldFormatted = getFieldFormatted(
        relativeRowIndex,
        columnId,
        indexPattern,
        rowsParsed,
      );
      // check if column have render method initialized
      const column = defaultColumns.find(column => column.id === columnId);

      if (column && column.render) {
        return column.render(fieldFormatted, rowsParsed[relativeRowIndex]);
      }

      // check if column have render method in renderColumns prop
      const renderColumn = renderColumns?.find(
        column => column.id === columnId,
      );

      if (renderColumn) {
        return renderColumn.render(
          fieldFormatted,
          rowsParsed[relativeRowIndex],
        );
      }

      // Format the value using the field formatter
      // https://github.com/opensearch-project/OpenSearch-Dashboards/blob/2.19.1/src/plugins/discover/public/application/components/data_grid/data_grid_table_cell_value.tsx#L80-L89
      const formattedValue = indexPattern.formatField(
        rows[relativeRowIndex],
        columnId,
      );

      if (formattedValue === undefined) {
        return <span>-</span>;
      } else {
        const sanitizedCellValue = dompurify.sanitize(formattedValue);

        return (
          // eslint-disable-next-line react/no-danger
          <span dangerouslySetInnerHTML={{ __html: sanitizedCellValue }} />
        );
      }
    }

    return null;
  };

  const columnSchemaDefinitions = useMemo(
    () => parseColumns(indexPattern?.fields || [], defaultColumns),
    [indexPattern?.fields, defaultColumns],
  );
  // Convert column definitions to Record<string, EuiDataGridColumn>
  const columnSchemaDefinitionsMap: Record<string, EuiDataGridColumn> = useMemo(
    () =>
      Object.fromEntries(
        columnSchemaDefinitions.map(column => [column.id, column]),
      ),
    [columnSchemaDefinitions],
  );
  const dataGridStateManager = useDataGridStatePersistenceManager({
    stateManagement: localStorageStatePersistenceManager(appId),
    defaultState: {
      columns: defaultColumns.map(column => column.id),
      columnWidths: {},
      pageSize: pagination?.pageSize || DEFAULT_PAGE_SIZE,
    },
    columnSchemaDefinitionsMap,
    indexPatternExists: !!indexPattern,
  });
  const onChangeItemsPerPage = useMemo(
    () => (pageSize: number) => {
      setPagination(pagination => ({
        ...pagination,
        pageSize,
        pageIndex: 0,
      }));
      dataGridStateManager.updateState({
        pageSize,
      });
    },
    [rows, rowCount],
  );

  useEffect(() => {
    setPagination(pagination => ({
      ...pagination,
      pageSize: dataGridStateManager.retrieveState().pageSize,
    }));
  }, [appId]);

  const { columnsAvailable, columns, columnVisibility, onColumnResize } =
    useDataGridColumns({
      appId,
      defaultColumns,
      columnSchemaDefinitionsMap,
      indexPatternExists: !!indexPattern,
    });

  return {
    'aria-labelledby': props.ariaLabelledBy,
    columnsAvailable, // This is a custom property used by the Available fields and is not part of EuiDataGrid component specification
    columns,
    columnVisibility,
    onColumnResize,
    renderCellValue: renderCellValue,
    trailingControlColumns,
    leadingControlColumns,
    rowCount: Math.min(rowCount, MAX_ENTRIES_PER_QUERY),
    sorting: { columns: sortingColumns, onSort },
    pagination: {
      ...pagination,
      onChangeItemsPerPage: onChangeItemsPerPage,
      onChangePage: onChangePage,
    },
    setPagination,
  } as EuiDataGridProps;
};
