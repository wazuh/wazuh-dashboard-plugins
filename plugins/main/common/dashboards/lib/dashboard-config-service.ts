import type {
  DashboardByRendererPanels,
  GridDataVisualizationPair,
  SavedVis,
} from '../types';
import { TYPES } from './constants';

export class DashboardPanelBuilderService {
  private panels: DashboardByRendererPanels = {};

  constructor(private dashboardLayoutDefinition: DashboardLayoutDefinition) {}

  private buildDashboardPanel = (
    key: string,
    gridData: { w: number; h: number; x: number; y: number },
    savedVis: SavedVis,
  ) => {
    return {
      [key]: {
        gridData: {
          ...gridData,
          i: key,
        },
        type: TYPES.VISUALIZATION,
        explicitInput: {
          id: key,
          savedVis,
        },
      },
    };
  };

  private addDashboardPanel({
    gridData,
    savedVis,
  }: GridDataVisualizationPair): DashboardPanelBuilderService {
    const key = (Object.keys(this.panels).length + 1).toString();
    this.panels = {
      ...this.panels,
      ...this.buildDashboardPanel(key, gridData, savedVis),
    };
    return this;
  }

  getDashboardPanels(): DashboardByRendererPanels {
    Array.from({
      length: this.dashboardLayoutDefinition.totalGridVisualizationPairs,
    }).forEach((_, index) => {
      const { gridData, savedVis } =
        this.dashboardLayoutDefinition.getGridVisualizationPairs()[index];
      this.addDashboardPanel({ gridData, savedVis });
    });
    return this.panels;
  }
}

export abstract class DashboardLayoutDefinition {
  private gridVisualizationPairs = [] as GridDataVisualizationPair[];

  getSavedVisualizations(): SavedVis[] {
    return this.gridVisualizationPairs.map(gridVisData => gridVisData.savedVis);
  }

  get totalGridVisualizationPairs() {
    return this.gridVisualizationPairs.length;
  }

  setGridVisualizationPairs(...items: GridDataVisualizationPair[]) {
    this.gridVisualizationPairs = items;
  }

  getGridVisualizationPairs(): GridDataVisualizationPair[] {
    return this.gridVisualizationPairs;
  }
}

export abstract class DashboardByRendererConfig {
  private panelBuilderService: DashboardPanelBuilderService;

  constructor(
    protected indexPatternId: string,
    protected layoutDefinition: DashboardLayoutDefinition,
  ) {
    this.panelBuilderService = new DashboardPanelBuilderService(
      layoutDefinition,
    );
  }

  protected getIndexPatternId(): string {
    return this.indexPatternId;
  }

  getSavedVisualizations(): SavedVis[] {
    return this.layoutDefinition.getSavedVisualizations();
  }

  getSavedVisualizationsIds(): string[] {
    return this.getSavedVisualizations().map(savedVis => savedVis.id);
  }

  getDashboardPanels(): DashboardByRendererPanels {
    return this.panelBuilderService.getDashboardPanels();
  }

  protected abstract getId(): string;

  protected abstract getTitle(): string;

  protected abstract getDescription(): string;

  getConfig() {
    return {
      id: this.getId(),
      title: this.getTitle(),
      description: this.getDescription(),
      panels: this.getDashboardPanels(),
    };
  }
}
