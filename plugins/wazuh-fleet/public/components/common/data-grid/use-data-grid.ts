import {
  EuiDataGridCellValueElementProps,
  EuiDataGridColumn,
  EuiDataGridProps,
  EuiDataGridSorting,
} from '@elastic/eui';
import React, { useEffect, useMemo, useState } from 'react';
import { SearchResponse } from '@opensearch-project/opensearch/api/types';
// ToDo: check how create this methods
import { IndexPattern } from '../../../../../../src/plugins/data/common';
import {
  parseData,
  getFieldFormatted,
  parseColumns,
} from './data-grid-service';

const MAX_ENTRIES_PER_QUERY = 10000;
const DEFAULT_PAGE_SIZE_OPTIONS = [20, 50, 100];

export type DataGridColumn = {
  render?: (value: any, rowItem: object) => string | React.ReactNode;
} & EuiDataGridColumn;

export type DataGridRenderColumn = Required<Pick<DataGridColumn, 'render'>> &
  Omit<DataGridColumn, 'render'>;

export interface DataGridProps {
  indexPattern: IndexPattern;
  results: SearchResponse;
  defaultColumns: DataGridColumn[];
  renderColumns?: DataGridRenderColumn[];
  DocViewInspectButton: ({
    rowIndex,
  }: EuiDataGridCellValueElementProps) => React.JSX.Element;
  ariaLabelledBy: string;
  pagination?: Partial<EuiDataGridProps['pagination']>;
  leadingControlColumns?: EuiDataGridProps['leadingControlColumns'];
  trailingControlColumns?: EuiDataGridProps['trailingControlColumns'];
}

export const useDataGrid = (props: DataGridProps): EuiDataGridProps => {
  const {
    indexPattern,
    DocViewInspectButton,
    results,
    defaultColumns,
    renderColumns,
    trailingControlColumns,
    pagination: defaultPagination,
  } = props;
  /** Columns **/
  const [columns, _setColumns] = useState<DataGridColumn[]>(defaultColumns);
  const [columnVisibility, setVisibility] = useState(() =>
    columns.map(({ id }) => id),
  );
  /** Rows */
  const [rows, setRows] = useState<any[]>([]);
  const rowCount = results ? (results?.hits?.total as number) : 0;

  /** Sorting **/
  // get default sorting from default columns
  const getDefaultSorting = () => {
    const defaultSort = columns.find(
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

  const onSort = sortingColumns => {
    setSortingColumns(sortingColumns);
  };

  /** Pagination **/
  const [pagination, setPagination] = useState<EuiDataGridProps['pagination']>(
    defaultPagination || {
      pageIndex: 0,
      pageSize: 20,
      pageSizeOptions: DEFAULT_PAGE_SIZE_OPTIONS,
    },
  );
  const onChangeItemsPerPage = useMemo(
    () => pageSize =>
      setPagination(pagination => ({
        ...pagination,
        pageSize,
        pageIndex: 0,
      })),
    [rows, rowCount],
  );
  const onChangePage = pageIndex =>
    setPagination(pagination => ({ ...pagination, pageIndex }));

  useEffect(() => {
    setRows(results?.hits?.hits || []);
  }, [results, results?.hits, results?.hits?.total]);

  useEffect(() => {
    setPagination(pagination => ({ ...pagination, pageIndex: 0 }));
  }, [rowCount]);

  const renderCellValue = ({ rowIndex, columnId, _setCellProps }) => {
    const rowsParsed = parseData(rows);
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
      const column = columns.find(column => column.id === columnId);

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

      return fieldFormatted;
    }

    return null;
  };

  const leadingControlColumns = useMemo(
    () => [
      ...(props?.leadingControlColumns || []),
      {
        id: 'inspectCollapseColumn',
        headerCellRender: () => null,
        rowCellRender: props =>
          DocViewInspectButton({
            ...props,
            rowIndex: props.rowIndex % pagination.pageSize,
          }),
        width: 40,
      },
    ],
    [results],
  );

  return {
    'aria-labelledby': props.ariaLabelledBy,
    columns: parseColumns(indexPattern?.fields || [], defaultColumns),
    columnVisibility: {
      visibleColumns: columnVisibility,
      setVisibleColumns: setVisibility,
    },
    renderCellValue: renderCellValue,
    leadingControlColumns: leadingControlColumns,
    trailingControlColumns: trailingControlColumns,
    rowCount: Math.min(rowCount, MAX_ENTRIES_PER_QUERY),
    sorting: { columns: sortingColumns, onSort },
    pagination: {
      ...pagination,
      onChangeItemsPerPage: onChangeItemsPerPage,
      onChangePage: onChangePage,
    },
  };
};
