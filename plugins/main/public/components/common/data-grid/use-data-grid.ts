import {
  EuiDataGridCellValueElementProps,
  EuiDataGridColumn,
  EuiDataGridProps,
  EuiDataGridSorting,
} from '@elastic/eui';
import React, { useEffect, useMemo, useState } from 'react';
import { SearchResponse } from '@opensearch-project/opensearch/api/types';
// ToDo: check how create this methods
import { parseData, getFieldFormatted, parseColumns } from './data-grid-service';
import { IndexPattern } from '../../../../../../src/plugins/data/common';
import { EuiDataGridPaginationProps } from '@opensearch-project/oui';

export interface PaginationOptions
  extends Pick<EuiDataGridPaginationProps, 'pageIndex' | 'pageSize' | 'pageSizeOptions'> {}

type SortingColumns = EuiDataGridSorting['columns'];

const MAX_ENTRIES_PER_QUERY = 10000;
const DEFAULT_PAGE_INDEX = 0;
const DEFAULT_PAGE_SIZE = 15;
const DEFAULT_PAGE_SIZE_OPTIONS = [DEFAULT_PAGE_SIZE, 25, 50, 100];
const DEFAULT_PAGINATION_OPTIONS: PaginationOptions = {
  pageIndex: DEFAULT_PAGE_INDEX,
  pageSize: DEFAULT_PAGE_SIZE,
  pageSizeOptions: DEFAULT_PAGE_SIZE_OPTIONS,
};

export interface RenderColumn {
  render: (value: any, rowItem: object) => string | React.ReactNode;
}

export type tDataGridColumn = Partial<RenderColumn> & EuiDataGridColumn;

export type tDataGridRenderColumn = RenderColumn & EuiDataGridColumn;

export type tDataGridProps = {
  indexPattern: IndexPattern;
  results: SearchResponse;
  defaultColumns: tDataGridColumn[];
  renderColumns?: tDataGridRenderColumn[];
  DocViewInspectButton: ({ rowIndex }: EuiDataGridCellValueElementProps) => React.JSX.Element;
  ariaLabelledBy: string;
  useDefaultPagination?: boolean;
  pagination?: typeof DEFAULT_PAGINATION_OPTIONS;
};

export const useDataGrid = (props: tDataGridProps): EuiDataGridProps => {
  const {
    indexPattern,
    DocViewInspectButton,
    results,
    defaultColumns,
    renderColumns,
    useDefaultPagination = false,
    pagination: paginationProps = {},
  } = props;
  /** Columns **/
  const [columns /* , setColumns */] = useState<tDataGridColumn[]>(defaultColumns);
  const [columnVisibility, setVisibility] = useState(() => columns.map(({ id }) => id));
  /** Rows */
  const [rows, setRows] = useState<any[]>([]);
  const rowCount = results ? (results?.hits?.total as number) : 0;
  /** Sorting **/
  // get default sorting from default columns
  const getDefaultSorting = () => {
    const defaultSort = columns.find((column) => column.isSortable || column.defaultSortDirection);
    return defaultSort
      ? [
          {
            id: defaultSort.id,
            direction: defaultSort.defaultSortDirection || 'desc',
          },
        ]
      : [];
  };
  const defaultSorting: SortingColumns = getDefaultSorting();
  const [sortingColumns, setSortingColumns] = useState(defaultSorting);
  const onSort = (sortingColumns: SortingColumns) => {
    setSortingColumns(sortingColumns);
  };
  /** Pagination **/
  const [pagination, setPagination] = useState<typeof DEFAULT_PAGINATION_OPTIONS>(
    useDefaultPagination
      ? DEFAULT_PAGINATION_OPTIONS
      : {
          ...DEFAULT_PAGINATION_OPTIONS,
          ...paginationProps,
        }
  );

  const onChangeItemsPerPage = useMemo(
    () => (pageSize: number) =>
      setPagination((pagination) => ({
        ...pagination,
        pageSize,
        pageIndex: 0,
      })),
    [rows, rowCount]
  );
  const onChangePage = (pageIndex: number) =>
    setPagination((pagination) => ({ ...pagination, pageIndex }));

  useEffect(() => {
    setRows(results?.hits?.hits || []);
  }, [results, results?.hits, results?.hits?.total]);

  useEffect(() => {
    setPagination((pagination) => ({ ...pagination, pageIndex: 0 }));
  }, [rowCount]);

  const renderCellValue = ({ rowIndex, columnId }: { rowIndex: number; columnId: string }) => {
    const rowsParsed = parseData(rows);
    // On the context data always is stored the current page data (pagination)
    // then the rowIndex is relative to the current page
    const relativeRowIndex = rowIndex % pagination.pageSize;
    if (rowsParsed.hasOwnProperty(relativeRowIndex)) {
      const fieldFormatted = getFieldFormatted(
        relativeRowIndex,
        columnId,
        indexPattern,
        rowsParsed
      );
      // check if column have render method initialized
      const column = columns.find((column) => column.id === columnId);
      if (column && column.render) {
        return column.render(fieldFormatted, rowsParsed[relativeRowIndex]);
      }
      // check if column have render method in renderColumns prop
      const renderColumn = renderColumns?.find((column) => column.id === columnId);
      if (renderColumn) {
        return renderColumn.render(fieldFormatted, rowsParsed[relativeRowIndex]);
      }

      return fieldFormatted;
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
    columns: parseColumns(indexPattern?.fields || [], defaultColumns),
    columnVisibility: {
      visibleColumns: columnVisibility,
      setVisibleColumns: setVisibility,
    },
    renderCellValue: renderCellValue,
    leadingControlColumns: leadingControlColumns,
    rowCount: rowCount < MAX_ENTRIES_PER_QUERY ? rowCount : MAX_ENTRIES_PER_QUERY,
    sorting: { columns: sortingColumns, onSort },
    pagination: {
      ...pagination,
      onChangeItemsPerPage: onChangeItemsPerPage,
      onChangePage: onChangePage,
    },
  };
};
