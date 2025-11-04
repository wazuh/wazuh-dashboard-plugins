import {
  DashboardByRendererConfig,
  DashboardLayoutDefinition,
} from '../../../../../../lib/dashboard-builder';
import {
  getVisStateRuleLevelEvolution,
  getVisStateTopActions,
  getVisStateTopActors,
  getVisStateTopCountries,
  getVisStateTopOrganizations,
} from '../vis-states';

export class GithubDrilldownRepositoryDashboardLayoutDefinition extends DashboardLayoutDefinition {
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
        savedVis: getVisStateTopActors(indexPatternId),
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

export class GithubDrilldownRepositoryDashboardByRendererConfig extends DashboardByRendererConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new GithubDrilldownRepositoryDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'github-drilldown-repository-dashboard';
  }

  protected override getTitle(): string {
    return 'GitHub Drilldown Repository Dashboard';
  }

  protected override getDescription(): string {
    return 'This dashboard provides insights into GitHub repository activities.';
  }
}
