import type {
  DashboardByValuePanels,
  DashboardByValueSavedVis,
  GridData,
  GridVisualPair,
} from './types';

export class DashboardPanelsBuilder {
  private panels: DashboardByValuePanels = {};

  constructor(
    private indexPatternId: string,
    private dashboardLayoutConfig: DashboardVisualizationConfig,
  ) {}

  private buildDashboardPanel = (
    key: string,
    gridData: { w: number; h: number; x: number; y: number },
    savedVis: DashboardByValueSavedVis,
  ) => {
    return {
      gridData: {
        ...gridData,
        i: key,
      },
      type: 'visualization' as const,
      explicitInput: {
        id: key,
        savedVis,
      },
    };
  };

  addPanel({
    gridData,
    savedVis,
  }: {
    gridData: GridData;
    savedVis: DashboardByValueSavedVis;
  }): DashboardPanelsBuilder {
    const key = (Object.keys(this.panels).length + 1).toString();
    this.panels[key] = this.buildDashboardPanel(key, gridData, savedVis);
    return this;
  }

  getAll(): DashboardByValuePanels {
    Array.from({
      length: this.dashboardLayoutConfig.savedVisualizationsCount,
    }).forEach((_, index) => {
      const { gridData, savedVis } =
        this.dashboardLayoutConfig.generateGridDataWithVisualization()[index];
      this.addPanel({ gridData, savedVis: savedVis(this.indexPatternId) });
    });
    return this.panels;
  }
}

export abstract class DashboardVisualizationConfig {
  protected savedVisualizations = [] as ((
    indexPatternId: string,
  ) => DashboardByValueSavedVis)[];

  constructor() {}

  getSavedVisualizations(): ((
    indexPatternId: string,
  ) => DashboardByValueSavedVis)[] {
    return this.savedVisualizations;
  }

  get savedVisualizationsCount() {
    return this.savedVisualizations.length;
  }

  abstract generateGridDataWithVisualization(): GridVisualPair[];
}

/* <DashboardByRenderer
      input={{
        viewMode: ViewMode.VIEW,
        panels: getDashboardPanels(dataSource?.id),
        isFullScreenMode: false,
        filters: fetchFilters ?? [],
        useMargins: true,
        id: 'agent-events-count-evolution',
        timeRange: {
          from: timeFilter.from,
          to: timeFilter.to,
        },
        title: 'Events count evolution',
        description: 'Dashboard of Events count evolution',
        refreshConfig: {
          pause: false,
          value: 15,
        },
        hidePanelTitles: true,
      }}
    /> */

export abstract class DashboardByRendererConfig {
  constructor(private dashboardPanelsConfig: DashboardPanelsBuilder) {}

  protected abstract getId(): string;

  protected abstract getTitle(): string;

  protected abstract getDescription(): string;

  protected abstract get useMargins(): boolean;

  protected abstract get hidePanelTitles(): boolean;

  getConfig() {
    return {
      id: this.getId(),
      title: this.getTitle(),
      description: this.getDescription(),
      panels: this.dashboardPanelsConfig.getAll(),
      useMargins: this.useMargins,
      hidePanelTitles: this.hidePanelTitles,
    };
  }
}
