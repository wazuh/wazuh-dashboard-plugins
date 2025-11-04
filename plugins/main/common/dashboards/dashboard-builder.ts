import type {
  DashboardByRendererPanels,
  SavedVis,
  GridData,
  GridDataVisualizationPair,
} from './types';

export class DashboardPanelManager {
  private panels: DashboardByRendererPanels = {};

  constructor(private dashboardLayoutConfig: DashboardLayoutConfig) {}

  private buildDashboardPanel = (
    key: string,
    gridData: { w: number; h: number; x: number; y: number },
    savedVis: SavedVis,
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

  private addPanel({
    gridData,
    savedVis,
  }: {
    gridData: GridData;
    savedVis: SavedVis;
  }): DashboardPanelManager {
    const key = (Object.keys(this.panels).length + 1).toString();
    this.panels[key] = this.buildDashboardPanel(key, gridData, savedVis);
    return this;
  }

  getPanels(): DashboardByRendererPanels {
    Array.from({
      length: this.dashboardLayoutConfig.savedVisualizationsCount,
    }).forEach((_, index) => {
      const { gridData, savedVis } =
        this.dashboardLayoutConfig.getGridVisualizationPairs()[index];
      this.addPanel({ gridData, savedVis });
    });
    return this.panels;
  }
}

export abstract class DashboardLayoutConfig {
  protected gridVisualizationItems = [] as GridDataVisualizationPair[];

  constructor() {}

  getSavedVisualizations(): SavedVis[] {
    return this.gridVisualizationItems.map(gridVisData => gridVisData.savedVis);
  }

  get savedVisualizationsCount() {
    return this.gridVisualizationItems.length;
  }

  getGridVisualizationPairs(): GridDataVisualizationPair[] {
    return this.gridVisualizationItems;
  }
}

export abstract class DashboardByRendererConfig {
  private dashboardPanelManager: DashboardPanelManager;

  constructor(
    protected indexPatternId: string,
    protected dashboardLayoutConfig: DashboardLayoutConfig,
  ) {
    this.dashboardPanelManager = new DashboardPanelManager(
      dashboardLayoutConfig,
    );
  }

  protected getIndexPatternId(): string {
    return this.indexPatternId;
  }

  getSavedVisualizations(): SavedVis[] {
    return this.dashboardLayoutConfig.getSavedVisualizations();
  }

  getSavedVisualizationsIds(): string[] {
    return this.getSavedVisualizations().map(savedVis => savedVis.id);
  }

  getDashboardPanels(): DashboardByRendererPanels {
    return this.dashboardPanelManager.getPanels();
  }

  protected abstract getId(): string;

  protected abstract getTitle(): string;

  protected abstract getDescription(): string;

  protected get useMargins(): boolean {
    return true;
  }

  protected get hidePanelTitles(): boolean {
    return false;
  }

  protected getClassName(): string {
    return '';
  }

  getConfig() {
    return {
      id: this.getId(),
      title: this.getTitle(),
      description: this.getDescription(),
      panels: this.getDashboardPanels(),
      useMargins: this.useMargins,
      hidePanelTitles: this.hidePanelTitles,
      className: this.getClassName(),
    };
  }
}
