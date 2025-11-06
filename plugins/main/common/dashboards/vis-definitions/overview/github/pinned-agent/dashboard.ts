import {
  DashboardConfig,
  DashboardLayoutDefinition,
} from '../../../../lib/dashboard-config-service';
import {
  getVisStateAgentActionTypeByOrganization,
  getVisStateAgentAlertsEvolutionByOrganization,
  getVisStateAgentTopOrganizationsByAlertCount,
  getVisStateAgentUsersWithMoreAlerts,
  getVisStateMetricActorsCount,
  getVisStateMetricOrganizationsCount,
  getVisStateMetricRepositoriesCount
} from '../vis-states';

export class GithubPinnedAgentDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();
    this.setGridVisualizationPairs(
      {
        gridData: {
          w: 16,
          h: 6,
          x: 0,
          y: 0,
        },
        savedVis: getVisStateMetricOrganizationsCount(indexPatternId),
      },
      {
        gridData: {
          w: 16,
          h: 6,
          x: 16,
          y: 0,
        },
        savedVis: getVisStateMetricRepositoriesCount(indexPatternId),
      },
      {
        gridData: {
          w: 16,
          h: 6,
          x: 32,
          y: 0,
        },
        savedVis: getVisStateMetricActorsCount(indexPatternId),
      },
      {
        gridData: {
          w: 29,
          h: 13,
          x: 0,
          y: 6,
        },
        savedVis: getVisStateAgentAlertsEvolutionByOrganization(indexPatternId),
      },
      {
        gridData: {
          w: 19,
          h: 13,
          x: 29,
          y: 6,
        },
        savedVis: getVisStateAgentTopOrganizationsByAlertCount(indexPatternId),
      },
      {
        gridData: {
          w: 19,
          h: 13,
          x: 0,
          y: 19,
        },
        savedVis: getVisStateAgentActionTypeByOrganization(indexPatternId),
      },
      {
        gridData: {
          w: 29,
          h: 13,
          x: 19,
          y: 19,
        },
        savedVis: getVisStateAgentUsersWithMoreAlerts(indexPatternId),
      },
    );
  }
}

export class GithubPinnedAgentDashboardConfig extends DashboardConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new GithubPinnedAgentDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'github-agent-pinned-dashboard-tab';
  }

  protected override getTitle(): string {
    return 'GitHub agent pinned dashboard';
  }

  protected override getDescription(): string {
    return 'Dashboard of the GitHub agent pinned';
  }
}
