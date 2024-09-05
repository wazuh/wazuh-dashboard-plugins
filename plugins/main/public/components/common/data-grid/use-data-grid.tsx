import {
  EuiDataGridCellValueElementProps,
  EuiDataGridColumn,
  EuiDataGridProps,
  EuiDataGridSorting,
} from '@elastic/eui';
import React, { useEffect, useMemo, useState, Fragment } from 'react';
import { SearchResponse } from '@opensearch-project/opensearch/api/types';
// ToDo: check how create this methods
import {
  parseData,
  getFieldFormatted,
  parseColumns,
} from './data-grid-service';
import { IndexPattern } from '../../../../../../src/plugins/data/common';
import dompurify from 'dompurify';

const MAX_ENTRIES_PER_QUERY = 10000;
const DEFAULT_PAGE_SIZE_OPTIONS = [20, 50, 100];

export type tDataGridColumn = {
  render?: (value: any, rowItem: object) => string | React.ReactNode;
} & EuiDataGridColumn;

export type tDataGridRenderColumn = Required<Pick<tDataGridColumn, 'render'>> &
  Omit<tDataGridColumn, 'render'>;

export type tDataGridProps = {
  indexPattern: IndexPattern;
  results: SearchResponse;
  defaultColumns: tDataGridColumn[];
  renderColumns?: tDataGridRenderColumn[];
  DocViewInspectButton: ({
    rowIndex,
  }: EuiDataGridCellValueElementProps) => React.JSX.Element;
  ariaLabelledBy: string;
  pagination?: Partial<EuiDataGridProps['pagination']>;
};

export const useDataGrid = (props: tDataGridProps): EuiDataGridProps => {
  const {
    indexPattern,
    DocViewInspectButton,
    results,
    defaultColumns,
    renderColumns,
    pagination: defaultPagination,
  } = props;
  /** Columns **/
  const [columns, setColumns] = useState<tDataGridColumn[]>(defaultColumns);
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

  const renderCellValue = ({ rowIndex, columnId, setCellProps }) => {
    const rowsParsed = parseData(rows);
    // On the context data always is stored the current page data (pagination)
    // then the rowIndex is relative to the current page
    const relativeRowIndex = rowIndex % pagination.pageSize;
    if (rowsParsed.hasOwnProperty(relativeRowIndex)) {
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

      // Format the value using the field formatter
      // https://github.com/opensearch-project/OpenSearch-Dashboards/blob/2.16.0/src/plugins/discover/public/application/components/data_grid/data_grid_table_cell_value.tsx#L80-L89
      const formattedValue = indexPattern.formatField(rows[rowIndex], columnId);
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
        rowCellRender: props =>
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
    rowCount:
      rowCount < MAX_ENTRIES_PER_QUERY ? rowCount : MAX_ENTRIES_PER_QUERY,
    sorting: { columns: sortingColumns, onSort },
    pagination: {
      ...pagination,
      onChangeItemsPerPage: onChangeItemsPerPage,
      onChangePage: onChangePage,
    },
  };
};
