import {
  DashboardConfig,
  DashboardLayoutDefinition,
} from '../../../../lib/dashboard-config-service';
import {
  getVisStateRequirements,
  getVisStateRequirementsAgentsHeatmap,
  getVisStateRequirementsByAgent,
  getVisStateTopAgentsByAlertsCount,
  getVisStateTopRequirementsOverTime
} from '../vis-states';

export class TscOverviewDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();
    this.setGridVisualizationPairs(
      {
        gridData: {
          w: 24,
          h: 14,
          x: 0,
          y: 0,
        },
        savedVis: getVisStateRequirements(indexPatternId),
      },
      {
        gridData: {
          w: 24,
          h: 14,
          x: 24,
          y: 0,
        },
        savedVis: getVisStateTopAgentsByAlertsCount(indexPatternId),
      },
      {
        gridData: {
          w: 48,
          h: 11,
          x: 0,
          y: 14,
        },
        savedVis: getVisStateTopRequirementsOverTime(indexPatternId),
      },
      {
        gridData: {
          w: 48,
          h: 19,
          x: 0,
          y: 25,
        },
        savedVis: getVisStateRequirementsAgentsHeatmap(indexPatternId),
      },
      {
        gridData: {
          w: 48,
          h: 9,
          x: 0,
          y: 44,
        },
        savedVis: getVisStateRequirementsByAgent(indexPatternId),
      },
    );
  }
}

export class TscOverviewDashboardConfig extends DashboardConfig {
  constructor(indexPatternId: string) {
    super(indexPatternId, new TscOverviewDashboardLayoutDefinition(indexPatternId));
  }

  protected override getId(): string {
    return 'tsc-overview-dashboard-tab';
  }

  protected override getTitle(): string {
    return 'TSC overview dashboard';
  }

  protected override getDescription(): string {
    return 'Dashboard of the TSC overview';
  }
}
