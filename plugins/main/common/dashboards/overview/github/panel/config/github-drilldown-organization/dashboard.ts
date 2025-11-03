import {
  DashboardByRendererConfig,
  DashboardLayoutConfig,
} from '../../../../../dashboard-builder';
import {
  getVisStateRuleLevelEvolution,
  getVisStateTopActions,
  getVisStateTopActors,
  getVisStateTopCountries,
  getVisStateTopRepositories,
} from '../vis-states';

export class GithubDrilldownOrganizationDashboardLayoutConfig extends DashboardLayoutConfig {
  constructor(indexPatternId: string) {
    super();
    this.gridVisualizationItems.push(
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
        savedVis: getVisStateTopActors(indexPatternId),
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

export class GithubDrilldownOrganizationDashboardByRendererConfig extends DashboardByRendererConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new GithubDrilldownOrganizationDashboardLayoutConfig(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'github-drilldown-organization-dashboard-tab';
  }

  protected override getTitle(): string {
    return 'GitHub Drilldown Organization Overview';
  }

  protected override getDescription(): string {
    return 'GitHub drilldown organization overview dashboard';
  }

  protected override get useMargins(): boolean {
    return true;
  }

  protected override get hidePanelTitles(): boolean {
    return true;
  }
}
