import {
  DashboardConfig,
  DashboardLayoutDefinition,
} from '../../../../lib/dashboard-config-service';
import {
  getVisStateCheckResultsByPolicy,
  getVisStatePolicyByCheckHeatmap,
  getVisStateResultsByAgent,
} from './vis-states';

export class SCAOverviewDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();

    const panels = Object.values({
      '1': {
        gridData: {
          w: 24,
          h: 10,
          x: 0,
          y: 0,
          i: '1',
        },
        type: 'visualization',
        explicitInput: {
          id: '1',
          savedVis: getVisStateResultsByAgent(indexPatternId),
        },
      },
      '2': {
        gridData: {
          w: 24,
          h: 10,
          x: 24,
          y: 0,
          i: '2',
        },
        type: 'visualization',
        explicitInput: {
          id: '2',
          savedVis: getVisStateCheckResultsByPolicy(indexPatternId),
        },
      },
      '3': {
        gridData: {
          w: 48,
          h: 12,
          x: 0,
          y: 10,
          i: '3',
        },
        type: 'visualization',
        explicitInput: {
          id: '3',
          savedVis: getVisStatePolicyByCheckHeatmap(indexPatternId),
        },
      },
    }).map(panel => ({
      gridData: panel.gridData,
      savedVis: panel.explicitInput.savedVis,
    }));

    this.setGridVisualizationPairs(...panels);
  }
}

export class SCAOverviewDashboardConfig extends DashboardConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new SCAOverviewDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'sca-overview-dashboard';
  }

  protected override getTitle(): string {
    return 'Software Composition Analysis Overview';
  }

  protected override getDescription(): string {
    return 'Dashboard for Software Composition Analysis (SCA) Overview';
  }
}

export class SCAOverviewDashboardPanelsService {
  public static getDashboardPanels(indexPatternId: string) {
    return new SCAOverviewDashboardConfig(indexPatternId).getDashboardPanels();
  }
}
