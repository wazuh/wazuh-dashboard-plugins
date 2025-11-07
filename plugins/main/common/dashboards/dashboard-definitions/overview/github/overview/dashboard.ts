import {
  DashboardConfig,
  DashboardLayoutDefinition,
} from '../../../../lib/dashboard-config-service';
import {
  getVisStateActionTypeByOrganization,
  getVisStateAlertsEvolutionByOrganization,
  getVisStateMetricActorsCount,
  getVisStateMetricOrganizationsCount,
  getVisStateMetricRepositoriesCount,
  getVisStateTopOrganizationsByAlertCount,
  getVisStateUsersWithMoreAlerts,
} from '../vis-states';

export class GithubOverviewDashboardLayoutDefinition extends DashboardLayoutDefinition {
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
        savedVis: getVisStateAlertsEvolutionByOrganization(indexPatternId),
      },
      {
        gridData: {
          w: 19,
          h: 13,
          x: 29,
          y: 6,
        },
        savedVis: getVisStateTopOrganizationsByAlertCount(indexPatternId),
      },
      {
        gridData: {
          w: 19,
          h: 13,
          x: 0,
          y: 19,
        },
        savedVis: getVisStateActionTypeByOrganization(indexPatternId),
      },
      {
        gridData: {
          w: 29,
          h: 13,
          x: 19,
          y: 19,
        },
        savedVis: getVisStateUsersWithMoreAlerts(indexPatternId),
      },
    );
  }
}

export class GithubOverviewDashboardConfig extends DashboardConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new GithubOverviewDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'github-overview-dashboard-tab';
  }

  protected override getTitle(): string {
    return 'GitHub overview dashboard';
  }

  protected override getDescription(): string {
    return 'Dashboard of the GitHub overview';
  }
}
