import { EuiDataGridColumn, EuiDataGridSorting } from '@elastic/eui';
import { EuiDataGridPaginationProps } from '@opensearch-project/oui';

export interface RenderColumn {
  render: (value: any, rowItem: object) => string | React.ReactNode;
}

export type DataGridColumn = Partial<RenderColumn> & EuiDataGridColumn;

export type DataGridRenderColumn = Required<Pick<DataGridColumn, 'render'>> &
  Omit<DataGridColumn, 'render'>;

export interface PaginationOptions
  extends Pick<
    EuiDataGridPaginationProps,
    'pageIndex' | 'pageSize' | 'pageSizeOptions'
  > {}

export type SortingColumns = EuiDataGridSorting['columns'];
