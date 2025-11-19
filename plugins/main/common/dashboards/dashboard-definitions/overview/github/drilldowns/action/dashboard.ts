import {
  DashboardConfig,
  DashboardLayoutDefinition,
} from '../../../../../lib/dashboard-config-service';
import {
  getVisStateRuleLevelEvolution,
  getVisStateTopActors,
  getVisStateTopCountries,
  getVisStateTopOrganizations,
  getVisStateTopRepositories,
} from '../vis-states';

export class GithubDrilldownActionDashboardLayoutDefinition extends DashboardLayoutDefinition {
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
        savedVis: getVisStateTopActors(indexPatternId),
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

export class GithubDrilldownActionDashboardConfig extends DashboardConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new GithubDrilldownActionDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'github-drilldown-action-dashboard-tab';
  }

  protected override getTitle(): string {
    return 'GitHub Drilldown Action Dashboard';
  }

  protected override getDescription(): string {
    return 'Dashboard of the GitHub drilldown action';
  }
}
