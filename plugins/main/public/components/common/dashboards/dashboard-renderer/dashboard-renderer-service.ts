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

/**
 * Turns the `panelsJSON` of a dashboard saved object into the panel map the
 * embeddable container expects.
 *
 * A dashboard panel can override the embeddable it renders through its own
 * `embeddableConfig` (and, in older objects, a sibling `title`). The platform
 * applies those overrides by merging them into `explicitInput` - see
 * `convertSavedDashboardPanelToPanelState` in the `dashboard` plugin - which is
 * where `EmbeddablePanel` reads them from. The relevant one here is `title`:
 * when a panel sets it the panel header uses that value, and an empty string
 * renders the panel with no header at all, regardless of how the underlying
 * saved object is named.
 *
 * This function used to rebuild `explicitInput` from scratch as
 * `{ id, savedObjectId }` and drop `embeddableConfig` on the floor, so those
 * overrides were silently ignored here while the platform's own dashboard app
 * honoured them. The same saved object rendered differently depending on which
 * of the two displayed it. Merging them keeps both paths in agreement.
 */
export function transformPanelsJSON(
  panelsJSON: string,
  refs: SavedDashboardSO['references'],
): Record<string, PanelInputSpec> {
  const panelsArr = JSON.parse(panelsJSON) as Array<any>;
  return Object.fromEntries(
    panelsArr.map(
      ({
        embeddableConfig,
        gridData,
        panelIndex,
        panelRefName,
        title,
        type,
        ...rest
      }) => [
        panelIndex,
        {
          ...rest,
          gridData,
          type: type ?? 'visualization',
          /* `embeddableConfig` goes last so a panel that sets a key in both
          places wins with the newer one, matching the platform. */
          explicitInput: {
            id: panelIndex,
            savedObjectId: refs.find(({ name }) => name === panelRefName)?.id,
            ...(title === undefined ? {} : { title }),
            ...embeddableConfig,
          },
        } as PanelInputSpec,
      ],
    ),
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
