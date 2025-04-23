import { EuiDataGridColumn, EuiDataGridSorting } from '@elastic/eui';
import { EuiDataGridPaginationProps } from '@opensearch-project/oui';

export interface RenderColumn {
  render: (value: any, rowItem: object) => string | React.ReactNode;
}

export type tDataGridColumn = Partial<RenderColumn> & EuiDataGridColumn;

export interface PaginationOptions
  extends Pick<
    EuiDataGridPaginationProps,
    'pageIndex' | 'pageSize' | 'pageSizeOptions'
  > {}

export type SortingColumns = EuiDataGridSorting['columns'];

export type tDataGridRenderColumn = RenderColumn & EuiDataGridColumn;
