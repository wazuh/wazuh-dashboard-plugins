import type {
  DashboardByValuePanels,
  DashboardByValueSavedVis,
  GridData,
  GridVisualPair,
} from './types';

export class DashboardPanelManager {
  private panels: DashboardByValuePanels = {};

  constructor(
    private indexPatternId: string,
    private dashboardLayoutConfig: DashboardLayoutConfig,
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

  private addPanel({
    gridData,
    savedVis,
  }: {
    gridData: GridData;
    savedVis: DashboardByValueSavedVis;
  }): DashboardPanelManager {
    const key = (Object.keys(this.panels).length + 1).toString();
    this.panels[key] = this.buildDashboardPanel(key, gridData, savedVis);
    return this;
  }

  getPanels(): DashboardByValuePanels {
    Array.from({
      length: this.dashboardLayoutConfig.savedVisualizationsCount,
    }).forEach((_, index) => {
      const { gridData, savedVis } =
        this.dashboardLayoutConfig.createGridVisualizationData()[index];
      this.addPanel({ gridData, savedVis: savedVis(this.indexPatternId) });
    });
    return this.panels;
  }
}

export abstract class DashboardLayoutConfig {
  protected savedVisualizations = [] as ((
    indexPatternId: string,
  ) => DashboardByValueSavedVis)[];

  constructor(private indexPatternId: string) {}

  getSavedVisualizations(): DashboardByValueSavedVis[] {
    return this.savedVisualizations.map(getSavedVis =>
      getSavedVis(this.indexPatternId),
    );
  }

  get savedVisualizationsCount() {
    return this.savedVisualizations.length;
  }

  abstract createGridVisualizationData(): GridVisualPair[];
}

export abstract class DashboardByRendererConfig {
  private dashboardPanelManager: DashboardPanelManager;

  constructor(
    protected indexPatternId: string,
    protected dashboardLayoutConfig: DashboardLayoutConfig,
  ) {
    this.dashboardPanelManager = new DashboardPanelManager(
      indexPatternId,
      dashboardLayoutConfig,
    );
  }

  protected getIndexPatternId(): string {
    return this.indexPatternId;
  }

  getSavedVisualizations(): DashboardByValueSavedVis[] {
    return this.dashboardLayoutConfig.getSavedVisualizations();
  }

  getSavedVisualizationsIds(): string[] {
    return this.getSavedVisualizations().map(savedVis => savedVis.id);
  }

  getDashboardPanels(): DashboardByValuePanels {
    return this.dashboardPanelManager.getPanels();
  }

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
      panels: this.getDashboardPanels(),
      useMargins: this.useMargins,
      hidePanelTitles: this.hidePanelTitles,
    };
  }
}
