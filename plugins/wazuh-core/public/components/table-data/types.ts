import { ReactNode } from 'react';
import { EuiBasicTableProps } from '@elastic/eui';

export interface TableDataProps<T> {
  preActionButtons?: ReactNode | ((options: any) => ReactNode);
  postActionButtons?: ReactNode | ((options: any) => ReactNode);
  title?: string;
  postTitle?: ReactNode;
  description?: string;
  /**
   * Define a render above to the table
   */
  preTable?: ReactNode | ((options: any) => ReactNode);
  /**
   * Define a render below to the table
   */
  postTable?: ReactNode | ((options: any) => ReactNode);
  /**
   * Enable the action to reload the data
   */
  showActionReload?: boolean;
  onDataChange?: (data: any) => void;
  onReload?: (newValue: number) => void;
  /**
   * Fetch context
   */
  fetchContext: any;
  /**
   * Function to fetch the data
   */
  fetchData: (params: {
    fetchContext: any;
    pagination: EuiBasicTableProps<T>['pagination'];
    sorting: EuiBasicTableProps<T>['sorting'];
  }) => Promise<{ items: any[]; totalItems: number }>;
  onFetchContextChange?: (context: any) => void;
  /**
   * Columns for the table
   */
  tableColumns: EuiBasicTableProps<T>['columns'] & {
    composeField?: string[];
    searchable?: string;
    show?: boolean;
  };
  /**
   * Table row properties for the table
   */
  rowProps?: EuiBasicTableProps<T>['rowProps'];
  /**
   * Table page size options
   */
  tablePageSizeOptions?: number[];
  /**
   * Table initial sorting direction
   */
  tableInitialSortingDirection?: 'asc' | 'desc';
  /**
   * Table initial sorting field
   */
  tableInitialSortingField?: string;
  /**
   * Table properties
   */
  tableProps?: Omit<
    EuiBasicTableProps<T>,
    | 'columns'
    | 'items'
    | 'loading'
    | 'pagination'
    | 'sorting'
    | 'onChange'
    | 'rowProps'
  >;
  /**
   * Refresh the fetch of data
   */
  reload?: number;
  saveStateStorage?: {
    system: 'localStorage' | 'sessionStorage';
    key: string;
  };
  /**
   * Show the field selector
   */
  showFieldSelector?: boolean;
}
