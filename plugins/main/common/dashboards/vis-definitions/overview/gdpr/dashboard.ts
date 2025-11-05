import {
  DashboardByRendererConfig,
  DashboardLayoutDefinition,
} from '../../../lib/dashboard-config-service';
import {
  getVisStateAgentRuleLevelDistribution,
  getVisStateAgentTopRequirements,
  getVisStateAgentTopRequirementsCount,
  getVisStateRequirements,
  getVisStateRequirementsByAgent,
  getVisStateRequirementsHeatmap,
  getVisStateRequirementsOverTime,
  getVisStateTopAgentsByAlertsCount,
  getVisStateTopRuleGroups,
  getVisStateTopRules,
} from './vis-states';

export abstract class GDPRDashboardLayoutDefinition extends DashboardLayoutDefinition {}

export class GDPROverviewDashboardLayoutDefinition extends GDPRDashboardLayoutDefinition {
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

export class GDPRPinnedAgentDashboardLayoutDefinition extends GDPRDashboardLayoutDefinition {
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

export abstract class GDPRDashboardByRendererConfig extends DashboardByRendererConfig {}

export class GDPROverviewDashboardByRendererConfig extends GDPRDashboardByRendererConfig {
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

export class GDPRPinnedAgentDashboardByRendererConfig extends GDPRDashboardByRendererConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new GDPRPinnedAgentDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'gdpr-agent-pinned-dashboard';
  }
  protected override getTitle(): string {
    return 'GDPR Agent Pinned Dashboard';
  }
  protected override getDescription(): string {
    return 'Dashboard of GDPR Agent Pinned';
  }
}
