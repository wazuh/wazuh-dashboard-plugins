import { EuiDataGridCellValueElementProps, EuiDataGridColumn, EuiDataGridProps, EuiDataGridSorting } from "@elastic/eui"
import React, { useEffect, useMemo, useState, Fragment } from "react";
import { SearchResponse } from "@opensearch-project/opensearch/api/types";
import { IFieldType, IndexPattern } from "../../../../../../src/plugins/data/common";
// ToDo: check how create this methods
import { parseData, getFieldFormatted } from './data_grid_service';

const MAX_ENTRIES_PER_QUERY = 10000;

type tDataGridProps = {
    indexPattern: IndexPattern;
    results: SearchResponse;
    defaultColumns: EuiDataGridColumn[];
    DocViewInspectButton: ({ rowIndex }: EuiDataGridCellValueElementProps) => React.JSX.Element
    ariaLabelledBy: string;
};

export const parseColumns = (fields: IFieldType[]): EuiDataGridColumn[] => {
    // remove _source field becuase is a object field and is not supported
    fields = fields.filter((field) => field.name !== '_source');
    return fields.map((field) => {
        return {
            ...field,
            id: field.name,
            display: field.name,
            schema: field.type,
            actions: {
                showHide: true,
            },
        };
    }) || [];
}

export const useDataGrid = (props: tDataGridProps): EuiDataGridProps => {
    const { indexPattern, DocViewInspectButton, results, defaultColumns } = props;
    /** Columns **/
    const [columns, setColumns] = useState<EuiDataGridColumn[]>(defaultColumns);
    const [columnVisibility, setVisibility] = useState(() =>
        columns.map(({ id }) => id)
    );
    /** Rows */
    const [rows, setRows] = useState<any[]>([]);
    const rowCount = results ? results?.hits?.total as number : 0;
    /** Sorting **/
    // get default sorting from default columns
    const getDefaultSorting = () => {
        const defaultSort = columns.find((column) => column.isSortable || column.defaultSortDirection);
        return defaultSort ? [{ id: defaultSort.id, direction: defaultSort.defaultSortDirection || 'desc' }] : [];
    }
    const defaultSorting: EuiDataGridSorting['columns'] = getDefaultSorting();
    const [sortingColumns, setSortingColumns] = useState(defaultSorting);
    const onSort = (sortingColumns) => {setSortingColumns(sortingColumns)};
    /** Pagination **/
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
    const onChangeItemsPerPage = useMemo(() => (pageSize) =>
            setPagination((pagination) => ({
                ...pagination,
                pageSize,
                pageIndex: 0,
            })), [rows, rowCount]);
    const onChangePage = (pageIndex) => setPagination((pagination) => ({ ...pagination, pageIndex }))

    useEffect(() => {
        setRows(results?.hits?.hits || [])
    }, [results, results?.hits, results?.hits?.total])

    useEffect(() => {
        setPagination((pagination) => ({ ...pagination, pageIndex: 0 }));
    }, [rowCount])

    const renderCellValue = ({ rowIndex, columnId, setCellProps }) => {
        const rowsParsed = parseData(rows);
        // On the context data always is stored the current page data (pagination)
        // then the rowIndex is relative to the current page
        const relativeRowIndex = rowIndex % pagination.pageSize;        
        return rowsParsed.hasOwnProperty(relativeRowIndex)
            ? getFieldFormatted(relativeRowIndex, columnId, indexPattern, rowsParsed)
            : null;
    };

    const leadingControlColumns = useMemo(() => {
        return [
            {
                id: 'inspectCollapseColumn',
                headerCellRender: () => null,
                rowCellRender: (props) => DocViewInspectButton({ ...props, rowIndex: props.rowIndex % pagination.pageSize }),
                width: 40,
            },
        ];
    }, [results]);

    return {
        "aria-labelledby": props.ariaLabelledBy,
        columns: parseColumns(indexPattern?.fields || []),
        columnVisibility: { visibleColumns: columnVisibility, setVisibleColumns: setVisibility },
        renderCellValue: renderCellValue,
        leadingControlColumns: leadingControlColumns,
        rowCount: rowCount < MAX_ENTRIES_PER_QUERY ? rowCount : MAX_ENTRIES_PER_QUERY,
        sorting: { columns: sortingColumns, onSort },
        pagination: {
            ...pagination,
            pageSizeOptions: [20, 50, 100],
            onChangeItemsPerPage: onChangeItemsPerPage,
            onChangePage: onChangePage,
        }
    }
}