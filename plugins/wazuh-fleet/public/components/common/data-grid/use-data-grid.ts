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
import { DEFAULT_PAGINATION_OPTIONS, MAX_ENTRIES_PER_QUERY } from './constants';
import useDataGridColumns from './use-data-grid-columns';

export type DataGridColumn = {
  render?: (value: any, rowItem: object) => string | React.ReactNode;
} & EuiDataGridColumn;

export type DataGridRenderColumn = Required<Pick<DataGridColumn, 'render'>> &
  Omit<DataGridColumn, 'render'>;

export interface DataGridProps {
  appId: string;
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
    appId,
    indexPattern,
    DocViewInspectButton,
    results,
    defaultColumns,
    renderColumns,
    trailingControlColumns,
    pagination: defaultPagination,
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

  const onSort = sortingColumns => {
    setSortingColumns(sortingColumns);
  };

  /** Pagination **/
  const [pagination, setPagination] = useState<EuiDataGridProps['pagination']>({
    ...DEFAULT_PAGINATION_OPTIONS,
    ...defaultPagination,
  });
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

  const renderCellValue = ({ rowIndex, columnId }) => {
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
  const columnDefinitions = useMemo(
    () => parseColumns(indexPattern?.fields || [], defaultColumns),
    [indexPattern?.fields, defaultColumns],
  );
  const { columnsAvailable, columns, columnVisibility, onColumnResize } =
    useDataGridColumns({
      appId,
      defaultColumns,
      columnDefinitions,
      allColumns: new Set(columnDefinitions?.map(({ id }) => id) || []),
    });

  return {
    'aria-labelledby': props.ariaLabelledBy,
    columnsAvailable, // This is a custom property used by the Available fields and is not part of EuiDataGrid component specification
    columns,
    columnVisibility,
    onColumnResize,
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
