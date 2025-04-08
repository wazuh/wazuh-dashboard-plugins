import {
  EuiDataGridCellValueElementProps,
  EuiDataGridProps,
  EuiDataGridSorting,
} from '@elastic/eui';
import React, { useEffect, useMemo, useState } from 'react';
import { SearchResponse } from '@opensearch-project/opensearch/api/types';
// ToDo: check how create this methods
import {
  parseData,
  getFieldFormatted,
  parseColumns,
} from './data-grid-service';
import {
  Filter,
  IndexPattern,
} from '../../../../../../src/plugins/data/common';
import dompurify from 'dompurify';
import { tDataGridColumn, tDataGridRenderColumn } from './types';
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGINATION_OPTIONS,
  MAX_ENTRIES_PER_QUERY,
} from './constants';
import useDataGridColumns from './use-data-grid-columns';
import useDataGridStatePersistenceManager from './data-grid-state-persistence-manager/use-data-grid-state-persistence-manager';
import { DataGridState } from './data-grid-state-persistence-manager/types';
import { localStoragePageSizeStatePersistenceManager } from './data-grid-state-persistence-manager/local-storage-page-size-state-persistence-manager';

export type tDataGridProps = {
  moduleId: string;
  indexPattern: IndexPattern;
  results: SearchResponse;
  defaultColumns: tDataGridColumn[];
  renderColumns?: tDataGridRenderColumn[];
  DocViewInspectButton: ({
    rowIndex,
  }: EuiDataGridCellValueElementProps) => React.JSX.Element;
  ariaLabelledBy: string;
  useDefaultPagination?: boolean;
  pagination?: typeof DEFAULT_PAGINATION_OPTIONS;
  filters?: Filter[];
  setFilters?: (filters: Filter[]) => void;
};

export const useDataGrid = (props: tDataGridProps): EuiDataGridProps => {
  const {
    moduleId,
    indexPattern,
    DocViewInspectButton,
    results,
    defaultColumns,
    renderColumns,
    useDefaultPagination = false,
    pagination: paginationProps = {} as typeof DEFAULT_PAGINATION_OPTIONS,
    filters = [],
    setFilters = () => {},
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
  const [pagination, setPagination] = useState<
    typeof DEFAULT_PAGINATION_OPTIONS
  >(
    useDefaultPagination
      ? DEFAULT_PAGINATION_OPTIONS
      : {
          ...DEFAULT_PAGINATION_OPTIONS,
          ...paginationProps,
        },
  );

  const columnSchemaDefinitions = useMemo(() => {
    return parseColumns(
      indexPattern?.fields || [],
      defaultColumns,
      indexPattern,
      rows,
      pagination.pageSize,
      filters,
      setFilters,
    );
  }, [indexPattern, rows, pagination.pageSize, filters, setFilters]);

  const { retrieveState: retrievePageSize, persistState: persistPageSize } =
    useDataGridStatePersistenceManager<DataGridState['pageSize']>({
      stateManagementId: 'page-size',
      stateManagement: localStoragePageSizeStatePersistenceManager,
      defaultState: paginationProps.pageSize || DEFAULT_PAGE_SIZE,
      validateState(state) {
        return typeof state === 'number' && Number.isInteger(state);
      },
    });

  useEffect(() => {
    setPagination(pagination => ({
      ...pagination,
      pageSize: retrievePageSize(moduleId),
    }));
  }, [moduleId]);

  const { columnsAvailable, columns, columnVisibility, onColumnResize } =
    useDataGridColumns({
      moduleId,
      defaultColumns,
      columnSchemaDefinitions,
    });
  const onChangeItemsPerPage = useMemo(
    () => (pageSize: number) => {
      setPagination(pagination => ({
        ...pagination,
        pageSize,
        pageIndex: 0,
      }));
      persistPageSize(moduleId, pageSize);
    },
    [rows, rowCount],
  );
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
    const rowsParsed = parseData(rows) || [];
    // On the context data always is stored the current page data (pagination)
    // then the rowIndex is relative to the current page
    const relativeRowIndex = rowIndex % pagination.pageSize;

    if (Object.prototype.hasOwnProperty.call(rowsParsed, relativeRowIndex)) {
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
      // https://github.com/opensearch-project/OpenSearch-Dashboards/blob/2.16.0/src/plugins/discover/public/application/components/data_grid/data_grid_table_cell_value.tsx#L80-L89
      const formattedValue = indexPattern.formatField(
        rows[relativeRowIndex],
        columnId,
      );
      if (typeof formattedValue === 'undefined') {
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

  const leadingControlColumns = useMemo(() => {
    return [
      {
        id: 'inspectCollapseColumn',
        headerCellRender: () => null,
        rowCellRender: (props: EuiDataGridCellValueElementProps) =>
          DocViewInspectButton({
            ...props,
            rowIndex: props.rowIndex % pagination.pageSize,
          }),
        width: 40,
      },
    ];
  }, [results]);

  return {
    'aria-labelledby': props.ariaLabelledBy,
    columnsAvailable, // This is a custom property used by the Available fields and is not part of EuiDataGrid component specification
    columns,
    columnVisibility,
    onColumnResize,
    renderCellValue: renderCellValue,
    leadingControlColumns: leadingControlColumns,
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
