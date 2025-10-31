import type {
  DashboardByValueInput,
  DashboardByValuePanelConfig,
  DashboardByValuePanels,
} from '../../../common/dashboards/types';

export class DashboardSavedObjectMapper {
  static mapPanelToSavedObject = (
    key: string,
    panel: DashboardByValuePanelConfig,
    { panelIndex }: { panelIndex: number },
  ) => {
    return {
      gridData: panel.gridData,
      panelIndex: key,
      type: 'visualization',
      panelRefName: `panel_${panelIndex}`,
      embeddableConfig: {},
    };
  };

  static mapPanelsToSavedObjects = (panels: DashboardByValuePanels) => {
    return Object.entries(panels).map(([key, panel], index) =>
      this.mapPanelToSavedObject(key, panel, {
        panelIndex: index,
      }),
    );
  };

  static mapDashboardInputToSavedObject = (
    dashboard: DashboardByValueInput,
    savedObjectVisualizationsIds: string[],
  ): SavedObjectDashboard => {
    const panelsMapped = this.mapPanelsToSavedObjects(dashboard.panels);

    const references = [];

    for (let i = 0; i < panelsMapped.length; i++) {
      const savedVisualizationId = savedObjectVisualizationsIds[i];
      const panel = panelsMapped[i];
      references.push({
        id: savedVisualizationId,
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
        optionsJSON: JSON.stringify({
          useMargins: dashboard.useMargins,
          hidePanelTitles: dashboard.hidePanelTitles,
        }),
        panelsJSON: JSON.stringify(panelsMapped),
        version: 1,
        timeRestore: false,
      },
      id: dashboard.id,
      references,
    };
  };
}
