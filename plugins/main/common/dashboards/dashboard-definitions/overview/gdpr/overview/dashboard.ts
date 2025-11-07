import {
  DashboardConfig,
  DashboardLayoutDefinition,
} from '../../../../lib/dashboard-config-service';
import {
  getVisStateRequirements,
  getVisStateRequirementsByAgent,
  getVisStateRequirementsHeatmap,
  getVisStateRequirementsOverTime,
  getVisStateTopAgentsByAlertsCount,
} from '../vis-states';

export class GDPROverviewDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();
    this.setGridVisualizationPairs(
      {
        gridData: {
          w: 33,
          h: 14,
          x: 0,
          y: 0,
        },
        savedVis: getVisStateTopAgentsByAlertsCount(indexPatternId),
      },
      {
        gridData: {
          w: 15,
          h: 14,
          x: 33,
          y: 0,
        },
        savedVis: getVisStateRequirements(indexPatternId),
      },
      {
        gridData: {
          w: 48,
          h: 11,
          x: 0,
          y: 14,
        },
        savedVis: getVisStateRequirementsOverTime(indexPatternId),
      },
      {
        gridData: {
          w: 48,
          h: 19,
          x: 0,
          y: 25,
        },
        savedVis: getVisStateRequirementsHeatmap(indexPatternId),
      },
      {
        gridData: {
          w: 48,
          h: 9,
          x: 0,
          y: 43,
        },
        savedVis: getVisStateRequirementsByAgent(indexPatternId),
      },
    );
  }
}

export class GDPROverviewDashboardConfig extends DashboardConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new GDPROverviewDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'gdpr-overview-dashboard';
  }
  protected override getTitle(): string {
    return 'GDPR Overview Dashboard';
  }
  protected override getDescription(): string {
    return 'Dashboard of GDPR Overview';
  }
}
