// Types for dashboard container service
export type Status = 'ready' | 'not_found' | 'error' | 'empty' | 'validating';

// Saved Object structure used by the adapter
export interface SavedDashboardSO {
  id: string;
  type: 'dashboard';
  attributes: {
    title: string;
    description?: string;
    panelsJSON: string;
    optionsJSON: string;
    timeRestore?: boolean;
    timeFrom?: string;
    timeTo?: string;
  };
  references: Array<{ name: string; type: string; id: string }>;
  version?: string;
}

export interface PanelInputSpec {
  gridData: { x: number; y: number; w: number; h: number; i?: string };
  type: 'visualization' | string;
  explicitInput: { id: string; savedObjectId?: string };
}

export interface DashboardByValueInput {
  title: string;
  panels: Record<string, PanelInputSpec>;
  useMargins?: boolean;
  hidePanelTitles?: boolean;
  description?: string;
  id?: string;
  viewMode: 'view' | 'edit';
  isFullScreenMode: boolean;
  filters: any[];
  query: any;
  refreshConfig: { pause: boolean; value: number };
  timeRange?: { from: string; to: string };
  lastReloadRequestTime?: number;
}

export interface DashboardConfigInput {
  title: string;
  description: string;
  dataSource: any;
  useMargins: boolean;
  hidePanelTitles: boolean;
  viewMode?: 'view' | 'edit';
  isFullScreenMode?: boolean;
  refreshConfig?: {
    pause: boolean;
    value: number;
  };
}

export interface DashboardServiceResult {
  success: boolean;
  status: Status;
  error?: string;
  dashboardTitle?: string;
  byValueInput?: DashboardByValueInput;
}