import { EuiDataGridColumn, EuiDataGridRowHeightsOptions, EuiDataGridSorting } from '@elastic/eui';

// Interfaces for sticky component props
export interface StickyInspectColumnProps {
  data: any[];
  onClickInspectDoc: (agent: any) => void;
  style?: React.CSSProperties;
}

export interface StickyNameHeaderProps {
  column: any;
  marginTop: number;
  nameColumnWidth: number;
  sorting?: {
    onSort?: (criteria: Array<{ id: string; direction: 'asc' | 'desc' }>) => void;
  };
  rowSizes: {
    headerRowHeight: number;
    dataRowHeight: number;
  };
}

export interface StickyNameColumnProps {
  data: any[];
  column: EuiDataGridColumn;
  nameColumnWidth: number;
  renderCellValue: any;
  style?: React.CSSProperties;
}

export interface StickyCheckboxColumnProps {
  maxRows: number;
  renderCheckboxRow: (props: any) => React.ReactNode;
  style?: React.CSSProperties;
}

export interface StickyActionsColumnProps {
  data: any[];
  actionsColumn: Array<{
    name: string;
    description: string;
    icon: string;
    onClick: (row: any, agent: any) => void;
    [key: string]: any;
  }>;
  toggleActionPopover: (rowIndex: number) => void;
  actionPopoverOpen: number | null;
  style?: React.CSSProperties;
}

/**
 * @interface DataGridProps
 * @description Specific props for the EuiDataGrid component
 */
export interface DataGridProps {
  columns: EuiDataGridColumn[];
  renderCellValue: (props: { rowIndex: number; columnId: string }) => React.ReactNode;
  sorting: EuiDataGridSorting;
  leadingControlColumns: Array<{
    id: string;
    width?: number;
    rowStickyCellRender?: (row: { rowIndex: number; visibleRowIndex: number }) => React.ReactNode;
  }>;
  [key: string]: any;
}
/**
 * @interface StickyDataGridProps
 * @description Specific props for sticky components
 */
export interface StickyDataGridProps {
  gridRef: React.RefObject<HTMLDivElement>;
  actionPopoverOpen: number | null;
  toggleActionPopover: (index: number) => void;
  nameColumnWidth: number;
  dataGridControlsHeight: number;
  rowSizes: EuiDataGridRowHeightsOptions;
  agentsRows: Array<any>;
  onClickInspectDoc: (rowIndex: number) => void;
  actionsColumn: Array<{
    name: string;
    description: string;
    icon: string;
    onClick: (row: any, agent: any) => void;
    [key: string]: any;
  }>;
  rowCount: number;
  actionsColumnRight?: number;
  isFullScreen?: boolean;
  checkboxColumnRef?: React.RefObject<HTMLDivElement>;
  inspectColumnRef?: React.RefObject<HTMLDivElement>;
  nameColumnRef?: React.RefObject<HTMLDivElement>;
  actionsColumnRef?: React.RefObject<HTMLDivElement>;
  getStickyColumnStyle?: () => React.CSSProperties;
}

/**
 * @interface StickyGridViewProps
 * @description Props for the StickyDataGrid component
 */
export interface StickyGridViewProps {
  dataGridProps: DataGridProps;
  stickyDataGridProps: StickyDataGridProps;
  toolbarVisibility?: {
    showColumnSelector?: boolean;
    showSortSelector?: boolean;
    showFullScreenSelector?: boolean;
    [key: string]: boolean | undefined;
  };
}
