import {
  DashboardByRendererConfig,
  DashboardLayoutConfig,
} from '../../dashboard-builder';
import {
  getVisStateAgentRuleLevelDistribution,
  getVisStateAgentTopRequirements,
  getVisStateAgentTopRequirementsCount,
  getVisStateAgentTopRuleGroups,
  getVisStateAgentTopRules,
  getVisStateRequirementsByAgent,
  getVisStateRequirementsHeatmap,
  getVisStateTopAgentsByCount,
  getVisStateTopRequirements,
} from './vis-states';

export abstract class PCIDashboardLayoutConfig extends DashboardLayoutConfig {}

export class PCIOverviewDashboardLayoutConfig extends PCIDashboardLayoutConfig {
  constructor(indexPatternId: string) {
    super();
    this.gridVisualizationItems.push(
      {
        gridData: {
          w: 24,
          h: 14,
          x: 0,
          y: 0,
        },
        savedVis: getVisStateTopRequirements(indexPatternId),
      },
      {
        gridData: {
          w: 24,
          h: 14,
          x: 24,
          y: 0,
        },
        savedVis: getVisStateTopAgentsByCount(indexPatternId),
      },
      {
        gridData: {
          w: 48,
          h: 19,
          x: 0,
          y: 14,
        },
        savedVis: getVisStateRequirementsHeatmap(indexPatternId),
      },
      {
        gridData: {
          w: 48,
          h: 9,
          x: 0,
          y: 33,
        },
        savedVis: getVisStateRequirementsByAgent(indexPatternId),
      },
    );
  }
}

export class PCIPinnedAgentDashboardLayoutConfig extends PCIDashboardLayoutConfig {
  constructor(indexPatternId: string) {
    super();
    this.gridVisualizationItems.push(
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

export abstract class PCIDashboardByRendererConfig extends DashboardByRendererConfig {}

export class PCIOverviewDashboardByRendererConfig extends PCIDashboardByRendererConfig {
  constructor(indexPatternId: string) {
    super(indexPatternId, new PCIOverviewDashboardLayoutConfig(indexPatternId));
  }

  protected override getId(): string {
    return 'pci-overview-dashboard-tab';
  }

  protected override getTitle(): string {
    return 'PCI overview dashboard';
  }

  protected override getDescription(): string {
    return 'Dashboard of the PCI overview';
  }
}

export class PCIPinnedAgentDashboardByRendererConfig extends PCIDashboardByRendererConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new PCIPinnedAgentDashboardLayoutConfig(indexPatternId),
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
