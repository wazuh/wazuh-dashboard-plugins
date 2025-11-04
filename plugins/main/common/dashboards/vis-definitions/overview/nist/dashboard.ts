import {
  DashboardByRendererConfig,
  DashboardLayoutDefinition,
} from '../../../lib/dashboard-builder';
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

export abstract class NistDashboardLayoutDefinition extends DashboardLayoutDefinition {}

export class NistOverviewDashboardLayoutDefinition extends NistDashboardLayoutDefinition {
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

export class NistPinnedAgentDashboardLayoutDefinition extends NistDashboardLayoutDefinition {
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

export abstract class NistDashboardByRendererConfig extends DashboardByRendererConfig {}

export class NistOverviewDashboardByRendererConfig extends NistDashboardByRendererConfig {
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

export class NistPinnedAgentDashboardByRendererConfig extends NistDashboardByRendererConfig {
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
