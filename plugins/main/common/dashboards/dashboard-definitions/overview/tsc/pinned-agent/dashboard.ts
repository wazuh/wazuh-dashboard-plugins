import {
  DashboardConfig,
  DashboardLayoutDefinition,
} from '../../../../lib/dashboard-config-service';
import {
  getVisStateAgentRequirements,
  getVisStateAgentRuleLevelDistribution,
  getVisStateAgentTopRequirements,
  getVisStateAgentTopRuleDescription,
  getVisStateAgentTopRuleGroups
} from '../vis-states';

export class TscPinnedAgentDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();
    this.setGridVisualizationPairs(
      {
        gridData: {
          w: 16,
          h: 11,
          x: 0,
          y: 0,
        },
        savedVis: getVisStateAgentTopRuleGroups(indexPatternId),
      },
      {
        gridData: {
          w: 16,
          h: 11,
          x: 16,
          y: 0,
        },
        savedVis: getVisStateAgentTopRuleDescription(indexPatternId),
      },
      {
        gridData: {
          w: 16,
          h: 11,
          x: 32,
          y: 0,
        },
        savedVis: getVisStateAgentTopRequirements(indexPatternId),
      },
      {
        gridData: {
          w: 36,
          h: 11,
          x: 0,
          y: 11,
        },
        savedVis: getVisStateAgentRequirements(indexPatternId),
      },
      {
        gridData: {
          w: 12,
          h: 11,
          x: 36,
          y: 11,
        },
        savedVis: getVisStateAgentRuleLevelDistribution(indexPatternId),
      },
    );
  }
}

export class TscPinnedAgentDashboardConfig extends DashboardConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new TscPinnedAgentDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'tsc-pinned-agent-dashboard-tab';
  }

  protected override getTitle(): string {
    return 'TSC pinned agent dashboard';
  }

  protected override getDescription(): string {
    return 'Dashboard of the TSC pinned agent';
  }
}
