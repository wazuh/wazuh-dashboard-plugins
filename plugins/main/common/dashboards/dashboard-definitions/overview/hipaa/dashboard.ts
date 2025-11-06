import {
  DashboardConfig,
  DashboardLayoutDefinition,
} from '../../../lib/dashboard-config-service';
import {
  getVisStateAgentCommonAlerts,
  getVisStateAgentRequirements,
  getVisStateAgentRequirementsOvertime,
  getVisStateAgentRuleLevelDistribution,
  getVisStateAgentTopRequirements,
  getVisStateAlertsVolumeByAgent,
  getVisStateMostActiveAgents,
  getVisStateRequirementDistributionByAgent,
  getVisStateRequirementsOverTime2,
  getVisStateStats,
  getVisStateTagsCloud,
  getVisStateTopRequirements,
} from './vis-states';

export abstract class HipaaDashboardLayoutDefinition extends DashboardLayoutDefinition {}

export class HipaaOverviewDashboardLayoutDefinition extends HipaaDashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();
    this.setGridVisualizationPairs(
      {
        gridData: {
          w: 24,
          h: 20,
          x: 0,
          y: 0,
        },
        savedVis: getVisStateAlertsVolumeByAgent(indexPatternId),
      },
      {
        gridData: {
          w: 12,
          h: 10,
          x: 24,
          y: 0,
        },
        savedVis: getVisStateTagsCloud(indexPatternId),
      },
      {
        gridData: {
          w: 12,
          h: 10,
          x: 36,
          y: 0,
        },
        savedVis: getVisStateTopRequirements(indexPatternId),
      },
      {
        gridData: {
          w: 12,
          h: 10,
          x: 24,
          y: 10,
        },
        savedVis: getVisStateMostActiveAgents(indexPatternId),
      },
      {
        gridData: {
          w: 12,
          h: 10,
          x: 36,
          y: 10,
        },
        savedVis: getVisStateStats(indexPatternId),
      },
      {
        gridData: {
          w: 24,
          h: 14,
          x: 0,
          y: 20,
        },
        savedVis: getVisStateRequirementsOverTime2(indexPatternId),
      },
      {
        gridData: {
          w: 24,
          h: 14,
          x: 24,
          y: 20,
        },
        savedVis: getVisStateRequirementDistributionByAgent(indexPatternId),
      },
    );
  }
}

export class HipaaPinnedAgentDashboardLayoutDefinition extends HipaaDashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();
    this.setGridVisualizationPairs(
      {
        gridData: {
          w: 24,
          h: 11,
          x: 0,
          y: 0,
        },
        savedVis: getVisStateAgentRequirementsOvertime(indexPatternId),
      },
      {
        gridData: {
          w: 24,
          h: 11,
          x: 24,
          y: 0,
        },
        savedVis: getVisStateAgentTopRequirements(indexPatternId),
      },
      {
        gridData: {
          w: 24,
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
          x: 24,
          y: 11,
        },
        savedVis: getVisStateAgentRuleLevelDistribution(indexPatternId),
      },
      {
        gridData: {
          w: 12,
          h: 11,
          x: 36,
          y: 11,
        },
        savedVis: getVisStateAgentCommonAlerts(indexPatternId),
      },
    );
  }
}

export abstract class HipaaDashboardConfig extends DashboardConfig {}

export class HipaaOverviewDashboardConfig extends HipaaDashboardConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new HipaaOverviewDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'hipaa-overview-dashboard-tab';
  }

  protected override getTitle(): string {
    return 'HIPAA Overview Dashboard';
  }

  protected override getDescription(): string {
    return 'HIPAA overview dashboard';
  }
}

export class HipaaPinnedAgentDashboardConfig extends HipaaDashboardConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new HipaaPinnedAgentDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'hipaa-pinned-agent-dashboard-tab';
  }

  protected override getTitle(): string {
    return 'HIPAA Pinned Agent Dashboard';
  }

  protected override getDescription(): string {
    return 'HIPAA pinned agent dashboard';
  }
}
