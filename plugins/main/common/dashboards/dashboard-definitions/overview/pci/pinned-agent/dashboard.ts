import {
  DashboardConfig,
  DashboardLayoutDefinition,
} from '../../../../lib/dashboard-config-service';
import {
  getVisStateAgentRuleLevelDistribution,
  getVisStateAgentTopRequirements,
  getVisStateAgentTopRequirementsCount,
  getVisStateAgentTopRuleGroups,
  getVisStateAgentTopRules
} from '../vis-states';

export class PCIPinnedAgentDashboardLayoutDefinition extends DashboardLayoutDefinition {
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
        savedVis: getVisStateAgentTopRules(indexPatternId),
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

export class PCIPinnedAgentDashboardConfig extends DashboardConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new PCIPinnedAgentDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'pci-pinned-agent-dashboard-tab';
  }

  protected override getTitle(): string {
    return 'PCI pinned agent dashboard';
  }

  protected override getDescription(): string {
    return 'Dashboard of the PCI pinned agent';
  }
}
