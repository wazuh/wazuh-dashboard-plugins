import { EuiDataGridCellValueElementProps, EuiDataGridColumn, EuiDataGridProps, EuiDataGridSorting } from "@elastic/eui"
import { useEffect, useMemo, useState } from "react";
import { SearchResponse } from "@opensearch-project/opensearch/api/types";
import { IFieldType, IndexPattern } from "../../../../../../../src/plugins/data/common";

type tDataGridProps = {
    indexPattern: IndexPattern;
    results: SearchResponse;
    defaultColumns: EuiDataGridColumn[];
    DocViewInspectButton: ({ rowIndex }: EuiDataGridCellValueElementProps) => React.JSX.Element
    ariaLabelledBy: string;
};

export const parseColumns = (fields: IFieldType[]): EuiDataGridColumn[] => {
    return fields.map((field) => {
        return {
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

    const parseData = (resultsHits: SearchResponse['hits']['hits']): any[] => {
        const data = resultsHits.map((hit) => {
            if (!hit) {
                return {}
            }
            const source = hit._source as object;
            const data = {
                ...source,
                _id: hit._id,
                _index: hit._index,
                _type: hit._type,
                _score: hit._score,
            };
            return data;
        });
        return data;
    }

    const renderCellValue = ({ rowIndex, columnId, setCellProps }) => {
        const rowsParsed = parseData(rows);
        function getFormatted(rowIndex, columnId) {
            if (columnId.includes('.')) {
                // when the column is a nested field. The column could have 2 to n levels
                // get dinamically the value of the nested field
                const nestedFields = columnId.split('.');
                let value = rowsParsed[rowIndex];
                nestedFields.forEach((field) => {
                    if (value) {
                        value = value[field];
                    }
                });
                return value;
            } else {
                return rowsParsed[rowIndex][columnId].formatted
                    ? rowsParsed[rowIndex][columnId].formatted
                    : rowsParsed[rowIndex][columnId];
            }
        }
        // On the context data always is stored the current page data (pagination)
        // then the rowIndex is relative to the current page
        const relativeRowIndex = rowIndex % pagination.pageSize;        
        return rowsParsed.hasOwnProperty(relativeRowIndex)
            ? getFormatted(relativeRowIndex, columnId)
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
        rowCount,
        sorting: { columns: sortingColumns, onSort },
        pagination: {
            ...pagination,
            pageSizeOptions: [20, 50, 100],
            onChangeItemsPerPage: onChangeItemsPerPage,
            onChangePage: onChangePage,
        }
    }
}