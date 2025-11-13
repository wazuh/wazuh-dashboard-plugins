import {
  DashboardConfig,
  DashboardLayoutDefinition,
} from '../../../../../lib/dashboard-config-service';
import {
  getVisStateRuleLevelEvolution,
  getVisStateTopActions,
  getVisStateTopCountries,
  getVisStateTopOrganizations,
  getVisStateTopRepositories,
} from '../vis-states';

export class GithubDrilldownActorDashboardLayoutDefinition extends DashboardLayoutDefinition {
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
        savedVis: getVisStateTopActions(indexPatternId),
      },
      {
        gridData: {
          w: 16,
          h: 11,
          x: 16,
          y: 0,
        },
        savedVis: getVisStateTopRepositories(indexPatternId),
      },
      {
        gridData: {
          w: 16,
          h: 11,
          x: 32,
          y: 0,
        },
        savedVis: getVisStateTopOrganizations(indexPatternId),
      },
      {
        gridData: {
          w: 24,
          h: 11,
          x: 0,
          y: 11,
        },
        savedVis: getVisStateTopCountries(indexPatternId),
      },
      {
        gridData: {
          w: 24,
          h: 11,
          x: 24,
          y: 11,
        },
        savedVis: getVisStateRuleLevelEvolution(indexPatternId),
      },
    );
  }
}

export class GithubDrilldownActorDashboardConfig extends DashboardConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new GithubDrilldownActorDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'github-drilldown-actor-dashboard-tab';
  }

  protected override getTitle(): string {
    return 'GitHub Drilldown Action Dashboard';
  }

  protected override getDescription(): string {
    return 'Dashboard of the GitHub drilldown action';
  }
}
