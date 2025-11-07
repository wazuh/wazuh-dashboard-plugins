import {
  DashboardConfig,
  DashboardLayoutDefinition,
} from '../../../../lib/dashboard-config-service';
import {
  getVisStateAgentRuleLevelDistribution,
  getVisStateAgentTopRequirements,
  getVisStateAgentTopRequirementsCount,
  getVisStateTopRuleGroups,
  getVisStateTopRules,
} from '../vis-states';

export class GDPRPinnedAgentDashboardLayoutDefinition extends DashboardLayoutDefinition {
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
        savedVis: getVisStateTopRuleGroups(indexPatternId),
      },
      {
        gridData: {
          w: 16,
          h: 11,
          x: 16,
          y: 0,
        },
        savedVis: getVisStateTopRules(indexPatternId),
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
          w: 35,
          h: 11,
          x: 0,
          y: 11,
        },
        savedVis: getVisStateAgentTopRequirementsCount(indexPatternId),
      },
      {
        gridData: {
          w: 13,
          h: 11,
          x: 35,
          y: 11,
        },
        savedVis: getVisStateAgentRuleLevelDistribution(indexPatternId),
      },
    );
  }
}

export class GDPRPinnedAgentDashboardConfig extends DashboardConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new GDPRPinnedAgentDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'gdpr-pinned-agent-dashboard';
  }
  protected override getTitle(): string {
    return 'GDPR Agent Pinned Dashboard';
  }
  protected override getDescription(): string {
    return 'Dashboard of GDPR Agent Pinned';
  }
}
