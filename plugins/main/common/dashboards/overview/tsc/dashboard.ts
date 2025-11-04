import {
  DashboardByRendererConfig,
  DashboardLayoutDefinition,
} from '../../dashboard-builder';
import {
  getVisStateAgentRequirements,
  getVisStateAgentRuleLevelDistribution,
  getVisStateAgentTopRequirements,
  getVisStateAgentTopRuleDescription,
  getVisStateAgentTopRuleGroups,
  getVisStateRequirements,
  getVisStateRequirementsAgentsHeatmap,
  getVisStateRequirementsByAgent,
  getVisStateTopAgentsByAlertsCount,
  getVisStateTopRequirementsOverTime,
} from './vis-states';

export abstract class TscDashboardLayoutDefinition extends DashboardLayoutDefinition {}

export class TscOverviewDashboardLayoutDefinition extends TscDashboardLayoutDefinition {
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

export class TscPinnedAgentDashboardLayoutDefinition extends TscDashboardLayoutDefinition {
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

export abstract class TscDashboardByRendererConfig extends DashboardByRendererConfig {}

export class TscOverviewDashboardByRendererConfig extends TscDashboardByRendererConfig {
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

export class TscPinnedAgentDashboardByRendererConfig extends TscDashboardByRendererConfig {
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
