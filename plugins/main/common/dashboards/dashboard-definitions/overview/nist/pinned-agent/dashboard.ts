import {
  DashboardConfig,
  DashboardLayoutDefinition,
} from '../../../../lib/dashboard-config-service';
import {
  getVisStateAgentRequirementsOverTime,
  getVisStateAgentRuleLevelDistribution,
  getVisStateAgentStats,
  getVisStateAgentTopRequirements,
} from '../vis-states';

export class NistPinnedAgentDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();
    this.setGridVisualizationPairs(
      {
        gridData: {
          w: 12,
          h: 11,
          x: 0,
          y: 0,
        },
        savedVis: getVisStateAgentStats(indexPatternId),
      },
      {
        gridData: {
          w: 12,
          h: 11,
          x: 12,
          y: 0,
        },
        savedVis: getVisStateAgentTopRequirements(indexPatternId),
      },
      {
        gridData: {
          w: 24,
          h: 11,
          x: 24,
          y: 0,
        },
        savedVis: getVisStateAgentRuleLevelDistribution(indexPatternId),
      },
      {
        gridData: {
          w: 48,
          h: 11,
          x: 0,
          y: 11,
        },
        savedVis: getVisStateAgentRequirementsOverTime(indexPatternId),
      },
    );
  }
}

export class NistPinnedAgentDashboardConfig extends DashboardConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new NistPinnedAgentDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'nist-pinned-agent-dashboard-tab';
  }

  protected override getTitle(): string {
    return 'NIST Pinned Agent Dashboard';
  }

  protected override getDescription(): string {
    return 'Dashboard of the NIST pinned agent';
  }
}
