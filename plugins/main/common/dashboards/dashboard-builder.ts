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
