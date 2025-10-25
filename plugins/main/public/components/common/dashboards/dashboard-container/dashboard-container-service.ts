import { SavedObject } from '../../../../react-services/saved-objects';

// Types for dashboard container service
export type Status = 'idle' | 'validating' | 'ready' | 'not_found' | 'error';

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
}

export interface DashboardServiceResult {
  success: boolean;
  status: Status;
  error?: string;
  dashboardTitle?: string;
  byValueInput?: DashboardByValueInput;
}

// Adapter helpers: transform Saved Object -> DashboardContainerByValueRenderer input
export function transformPanelsJSON(
  panelsJSON: string,
  refs: SavedDashboardSO['references'],
): Record<string, PanelInputSpec> {
  const panelsArr = JSON.parse(panelsJSON) as Array<any>;
  return Object.fromEntries(
    panelsArr.map(({ gridData, panelIndex, panelRefName, type }) => [
      panelIndex,
      {
        gridData,
        type: type ?? 'visualization',
        explicitInput: {
          id: panelIndex,
          savedObjectId: refs.find(({ name }) => name === panelRefName)?.id,
        },
      } as PanelInputSpec,
    ]),
  );
}

export function toByValueInput(so: SavedDashboardSO): DashboardByValueInput {
  const options = JSON.parse(so.attributes.optionsJSON);
  const panels = transformPanelsJSON(so.attributes.panelsJSON, so.references);
  const input: DashboardByValueInput = {
    title: so.attributes.title,
    description: so.attributes.description,
    panels,
    useMargins: options.useMargins,
    hidePanelTitles: options.hidePanelTitles,
    id: so.id,
    viewMode: 'view',
    isFullScreenMode: false,
    filters: [],
    query: '',
    refreshConfig: { pause: false, value: 15 },
    // Some visualizations fails when not receive a timeRange
    /*timeRange: so.attributes.timeRestore
      ? { from: so.attributes.timeFrom!, to: so.attributes.timeTo! }
      : ,*/
    timeRange: {
      from: "2024-10-23T15:59:21.359Z",
      to: "2025-10-23T15:59:21.359Z"
    } 
  };
  return input;
}

/**
 * Service function to build dashboard by-value input from a dashboard ID
 * Handles validation, fetching, and transformation of dashboard saved objects
 */
export async function buildDashboardByValueInput(
  dashboardId: string,
): Promise<DashboardServiceResult> {
  // Validate dashboard ID
  if (!dashboardId || typeof dashboardId !== 'string' || dashboardId.trim() === '') {
    return {
      success: false,
      status: 'not_found',
      error: 'Dashboard ID is required.',
    };
  }

  try {
    // Quick validation of existence
    const result = await SavedObject.existsDashboard(dashboardId);
    if (!result || typeof result !== 'object' || !(result as any).status) {
      return {
        success: false,
        status: 'not_found',
        error: 'Requested dashboard not found.',
      };
    }

    // Fetch full saved object and transform it to by-value input
    const { data } = (await SavedObject.getDashboardById(
      dashboardId,
    )) as { data: SavedDashboardSO };

    const byValueInput = toByValueInput(data);
    
    return {
      success: true,
      status: 'ready',
      dashboardTitle: data.attributes.title,
      byValueInput,
    };
  } catch (err: any) {
    return {
      success: false,
      status: 'error',
      error: err?.message || 'Error building dashboard input.',
    };
  }
}