import {
  DashboardByRendererConfig,
  DashboardLayoutConfig,
} from '../../dashboard-builder';
import {
  getVisStateAgentRequirementsOverTime,
  getVisStateAgentRuleLevelDistribution,
  getVisStateAgentStats,
  getVisStateAgentTopRequirements,
  getVisStateMetrics,
  getVisStateMostActiveAgents,
  getVisStateRequirementsAgentsHeatmap,
  getVisStateRequirementsByAgents,
  getVisStateRequirementsOverTime,
  getVisStateTopRequirements,
} from './vis-states';

export abstract class NistDashboardLayoutConfig extends DashboardLayoutConfig {}

export class NistOverviewDashboardLayoutConfig extends NistDashboardLayoutConfig {
  constructor(indexPatternId: string) {
    super();
    this.gridVisualizationItems.push(
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

export class NistPinnedAgentDashboardLayoutConfig extends NistDashboardLayoutConfig {
  constructor(indexPatternId: string) {
    super();
    this.gridVisualizationItems.push(
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

export abstract class NistDashboardByRendererConfig extends DashboardByRendererConfig {}

export class NistOverviewDashboardByRendererConfig extends NistDashboardByRendererConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new NistOverviewDashboardLayoutConfig(indexPatternId),
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

export class NistPinnedAgentDashboardByRendererConfig extends NistDashboardByRendererConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new NistPinnedAgentDashboardLayoutConfig(indexPatternId),
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