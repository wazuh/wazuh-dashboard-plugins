import {
  DashboardConfig,
  DashboardLayoutDefinition,
} from '../../../../lib/dashboard-config-service';
import {
  getVisStateMetrics,
  getVisStateMostActiveAgents,
  getVisStateRequirementsAgentsHeatmap,
  getVisStateRequirementsByAgents,
  getVisStateRequirementsOverTime,
  getVisStateTopRequirements
} from '../vis-states';

export class NistOverviewDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();
    this.setGridVisualizationPairs(
      {
        gridData: {
          w: 11,
          h: 14,
          x: 0,
          y: 0,
        },
        savedVis: getVisStateMostActiveAgents(indexPatternId),
      },
      {
        gridData: {
          w: 24,
          h: 14,
          x: 11,
          y: 0,
        },
        savedVis: getVisStateRequirementsOverTime(indexPatternId),
      },
      {
        gridData: {
          w: 13,
          h: 14,
          x: 35,
          y: 0,
        },
        savedVis: getVisStateRequirementsByAgents(indexPatternId),
      },
      {
        gridData: {
          w: 24,
          h: 12,
          x: 0,
          y: 14,
        },
        savedVis: getVisStateRequirementsAgentsHeatmap(indexPatternId),
      },
      {
        gridData: {
          w: 11,
          h: 12,
          x: 24,
          y: 14,
        },
        savedVis: getVisStateMetrics(indexPatternId),
      },
      {
        gridData: {
          w: 13,
          h: 12,
          x: 35,
          y: 14,
        },
        savedVis: getVisStateTopRequirements(indexPatternId),
      },
    );
  }
}

export class NistOverviewDashboardConfig extends DashboardConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new NistOverviewDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return `nist-overview-dashboard-tab`;
  }

  protected override getTitle(): string {
    return 'NIST Overview Dashboard';
  }

  protected override getDescription(): string {
    return 'Dashboard of the NIST overview';
  }
}
