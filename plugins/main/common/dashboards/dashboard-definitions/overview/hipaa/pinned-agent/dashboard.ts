import {
  DashboardConfig,
  DashboardLayoutDefinition,
} from '../../../../lib/dashboard-config-service';
import { HipaaOverviewDashboardLayoutDefinition } from "../overview/dashboard";
import {
  getVisStateAgentCommonAlerts,
  getVisStateAgentRequirements,
  getVisStateAgentRequirementsOvertime,
  getVisStateAgentRuleLevelDistribution,
  getVisStateAgentTopRequirements
} from '../vis-states';

export class HipaaPinnedAgentDashboardLayoutDefinition extends DashboardLayoutDefinition {
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
