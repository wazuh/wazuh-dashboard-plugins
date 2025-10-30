import type { DashboardByValueInput, DashboardByValuePanels, DashboardByValueSavedVis } from "../../../common/saved-vis/types";
import { randomId } from "./utils";

const dashboardByValuePanelToSavedObjectMapper = (panel: DashboardByValuePanels, { panelIndex }: { panelIndex: number }) => {
  const savedVisualId = `${panel.savedVis.id}-${randomId()}`;
  return {
    // version: '3.2.0', // TODO: Check if needed
    gridData: {
      w: panel.w,
      h: panel.h,
      x: panel.x,
      y: panel.y,
      i: savedVisualId,
    },
    panelIndex: savedVisualId,
    embeddableConfig: {}, // TODO: Check if needed
    panelRefName: `panel_${savedVisualId}_${panelIndex}`,
  };
};

const dashboardByValuePanelsToSavedObjectMapper = (panels: DashboardByValuePanels[]) => {
  return panels
    .map((panel, index) =>
      dashboardByValuePanelToSavedObjectMapper(panel, { panelIndex: index }),
    );
}

/**
 * Example usage:
 *  const savedObject = mapperDashboardByValueSavedVisToSavedObject(getVisStateTopSources("index-pattern-id"));
 */
const dashboardByValueSavedVisToSavedObjectMapper = (savedVis: DashboardByValueSavedVis): SavedObjectVisualization => {
  return {
    attributes: {
      title: savedVis.title,
      description: '', // TODO: Check if needed
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
    migrationVersion: { visualization: '7.10.0' }, // TODO: Check if needed
    references: savedVis.data.references,
    type: 'visualization',
    updated_at: new Date().toISOString(), // TODO: Check if needed
    // version: randomId(), // TODO: Check if needed
  };
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