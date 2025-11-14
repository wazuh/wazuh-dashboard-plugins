import { SavedObject } from '../../../../react-services/saved-objects';
import {
  SavedDashboardSO,
  PanelInputSpec,
  DashboardByValueInput,
  DashboardConfigInput,
  DashboardServiceResult,
} from './types';

type DashboardRendererSearchBarProps = {
  query?: string;
  dateRangeFrom: string;
  dateRangeTo: string;
};

type DashboardRendererDataSource = {
  fetchFilters?: any[];
  searchBarProps?: DashboardRendererSearchBarProps;
  fingerprint?: number;
};

export function transformPanelsJSON(
  panelsJSON: string,
  refs: SavedDashboardSO['references'],
): Record<string, PanelInputSpec> {
  const panelsArr = JSON.parse(panelsJSON) as Array<any>;
  return Object.fromEntries(
    panelsArr.map(({ gridData, panelIndex, panelRefName, type }) => [
      panelIndex,
      {
        ...panelsArr[panelIndex],
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

export function toByValueInput(
  so: SavedDashboardSO,
  config?: DashboardConfigInput,
): DashboardByValueInput {
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
    // set default time range
    timeRange: {
      from: 'now-1y',
      to: 'now',
    },
    lastReloadRequestTime: 0,
    query: '',
    refreshConfig: {
      pause: false,
      value: 15,
    },
  };
  return input;
}

export function getFiltersParams(config?: {
  dataSource?: DashboardRendererDataSource;
  refreshConfig?: any;
}) {
  return {
    filters: config?.dataSource?.fetchFilters ?? [],
    query: config?.dataSource?.searchBarProps?.query ?? '',
    refreshConfig: config?.refreshConfig || { pause: false, value: 15 },
    timeRange: config?.dataSource?.searchBarProps && {
      from: config.dataSource.searchBarProps.dateRangeFrom,
      to: config.dataSource.searchBarProps.dateRangeTo,
    },
    lastReloadRequestTime: config?.dataSource?.fingerprint,
  };
}

/**
 * Service function to build dashboard by-value input from a dashboard ID
 * Handles validation, fetching, and transformation of dashboard saved objects
 */
export async function buildDashboardByValueInput(
  dashboardId: string,
  config?: DashboardConfigInput,
): Promise<DashboardServiceResult> {
  // Validate dashboard ID
  if (
    !dashboardId ||
    typeof dashboardId !== 'string' ||
    dashboardId.trim() === ''
  ) {
    return {
      success: false,
      status: 'empty',
      error: 'Dashboard ID is required.',
    };
  }

  try {
    const data = (await SavedObject.getDashboardById(dashboardId)) as {
      data: SavedDashboardSO;
    };

    if (data?.error?.statusCode === 404) {
      return {
        success: false,
        status: 'not_found',
        error: 'Requested dashboard not found.',
      };
    }

    const byValueInput = toByValueInput(data, config);

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
