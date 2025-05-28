import { Filter, IndexPattern, IOpenSearchSearchResponse, IOpenSearchDashboardsSearchResponse, TimeRange } from 'src/plugins/data/public';
import { DataGridColumn } from '../../data-grid/types';
import { EuiDataGridControlColumn } from '@elastic/eui';

// Extract SearchResponse type from IOpenSearchSearchResponse
type ExtractSearchResponse<T> = T extends IOpenSearchDashboardsSearchResponse<infer U> ? U : never;
type SearchResponse = ExtractSearchResponse<IOpenSearchSearchResponse>;


export interface TWazuhDataGridProps {
    appId: string;
    indexPattern: IndexPattern;
    results: SearchResponse;
    defaultColumns: DataGridColumn[];
    leadingControlColumns?: EuiDataGridControlColumn[];
    trailingControlColumns?: EuiDataGridControlColumn[];
    isLoading: boolean;
    defaultPagination: {
        pageIndex: number;
        pageSize: number;
        pageSizeOptions: number[];
    };
    query: any;
    exportFilters: tFilter[];
    dateRange: TimeRange;
    onChangePagination: (pagination: {
        pageIndex: number;
        pageSize: number;
    }) => void;
    onChangeSorting: (sorting: { columns: any[]; onSort: any }) => void;
    actionsColumn?: Array<{
        name: string;
        description: string;
        icon: string;
        onClick: (row: any, agent: any) => void;
        [key: string]: any;
    }>;
    filters?: Filter[];
    addFilters?: (filters: Filter[]) => void;
    dataGridMode?: 'sticky'|'normal';
}
