import {
  DashboardConfig,
  DashboardLayoutDefinition,
} from '../../../../lib/dashboard-config-service';
import {
  getVisStateFIMAlertsByActionOverTime,
  getVisStateFIMCommonActions,
  getVisStateFIMEventsSummary,
  getVisStateFIMTopAgentsPie,
  getVisStateFIMTopAgentsUser,
  getVisStateFIMTopRules,
} from '../vis-states';

export class FimOverviewDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();
    this.setGridVisualizationPairs(
      {
        gridData: {
          w: 48,
          h: 10,
          x: 0,
          y: 0,
        },
        savedVis: getVisStateFIMAlertsByActionOverTime(indexPatternId),
      },
      {
        gridData: {
          w: 14,
          h: 10,
          x: 0,
          y: 10,
        },
        savedVis: getVisStateFIMTopAgentsPie(indexPatternId),
      },
      {
        gridData: {
          w: 34,
          h: 10,
          x: 14,
          y: 10,
        },
        savedVis: getVisStateFIMEventsSummary(indexPatternId),
      },
      {
        gridData: {
          w: 16,
          h: 10,
          x: 0,
          y: 20,
        },
        savedVis: getVisStateFIMTopRules(indexPatternId),
      },
      {
        gridData: {
          w: 16,
          h: 10,
          x: 16,
          y: 20,
        },
        savedVis: getVisStateFIMCommonActions(indexPatternId),
      },
      {
        gridData: {
          w: 16,
          h: 10,
          x: 32,
          y: 20,
        },
        savedVis: getVisStateFIMTopAgentsUser(indexPatternId),
      },
    );
  }
}

export class FimOverviewDashboardConfig extends DashboardConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new FimOverviewDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'fim-overview-dashboard';
  }

  protected override getTitle(): string {
    return 'File Integrity Monitoring Overview';
  }

  protected override getDescription(): string {
    return 'Overview dashboard for File Integrity Monitoring (FIM)';
  }
}
