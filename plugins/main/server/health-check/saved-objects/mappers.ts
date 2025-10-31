import type {
  DashboardByValueInput,
  DashboardByValuePanelConfig,
  DashboardByValuePanels,
  DashboardByValueSavedVis,
} from '../../../common/dashboards/types';

/**
 * Example usage:
 *  const savedObject = mapperDashboardByValueSavedVisToSavedObject(getVisStateTopSources("index-pattern-id"));
 */
const dashboardByValueSavedVisToSavedObjectMapper = (
  savedVis: DashboardByValueSavedVis,
): SavedObjectVisualization => {
  return {
    attributes: {
      title: savedVis.title || 'Untitled Visualization',
      kibanaSavedObjectMeta: {
        searchSourceJSON: JSON.stringify(savedVis.data.searchSource),
      },
      version: 1, // TODO: Check if needed
      uiStateJSON: JSON.stringify(savedVis.uiState || {}),
      visState: JSON.stringify({
        title: savedVis.title,
        type: savedVis.type,
        aggs: savedVis.data.aggs,
        params: savedVis.params,
      }),
    },
    id: savedVis.id,
    references: savedVis.data.references,
  };
};

const dashboardByValuePanelToSavedObjectMapper = (
  key: string,
  panel: DashboardByValuePanelConfig,
  { panelIndex }: { panelIndex: number },
) => {
  return {
    gridData: panel.gridData,
    // version: '7.10.0', // TODO: Check if needed
    panelIndex: key,
    type: 'visualization',
    panelRefName: `panel_${panelIndex}`,
    embeddableConfig: {},
  };
};

const dashboardByValuePanelsToSavedObjectMapper = (
  panels: DashboardByValuePanels,
) => {
  return Object.entries(panels).map(([key, panel], index) =>
    dashboardByValuePanelToSavedObjectMapper(key, panel, { panelIndex: index }),
  );
};

const dashboardByValueInputToSavedObjectMapper = (
  dashboard: DashboardByValueInput,
  savedObjectVisualizations: SavedObjectVisualization[],
): SavedObjectDashboard => {
  const panelsMapped = dashboardByValuePanelsToSavedObjectMapper(
    dashboard.panels,
  );

  const references = [];

  for (let i = 0; i < panelsMapped.length; i++) {
    const savedVisualization = savedObjectVisualizations[i];
    const panel = panelsMapped[i];
    references.push({
      id: savedVisualization.id,
      name: panel.panelRefName,
      type: 'visualization',
    });
  }

  return {
    attributes: {
      title: dashboard.title,
      description: dashboard.description,
      kibanaSavedObjectMeta: {
        searchSourceJSON: JSON.stringify({
          query: {
            query: '',
            language: 'kuery',
          },
          filter: [],
        }),
      },
      version: 1, // TODO: Check if needed
      hits: 0, // TODO: Check if needed
      optionsJSON: JSON.stringify({
        useMargins: dashboard.useMargins,
        hidePanelTitles: dashboard.hidePanelTitles,
      }),
      panelsJSON: JSON.stringify(panelsMapped),
      timeRestore: false, // TODO: Check if needed
    },
    id: dashboard.id,
    migrationVersion: { dashboard: '7.10.0' }, // TODO: Check if needed
    references,
    type: 'dashboard',
    updated_at: new Date().toISOString(), // TODO: Check if needed
    // version: randomId(), // TODO: Check if needed
  };
};
