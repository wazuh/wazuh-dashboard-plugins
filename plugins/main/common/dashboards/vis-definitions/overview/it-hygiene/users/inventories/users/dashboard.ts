import {
  buildDashboardKPIPanels,
  getVisStateHorizontalBarByField
} from '../../../../../../lib';
import {
  DashboardByRendererConfig,
  DashboardLayoutDefinition,
} from '../../../../../../lib/dashboard-config-service';
import type { DashboardByRendererPanels } from '../../../../../../types';

export class ITHygieneUsersInventoriesUsersDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();

    const panels = Object.values(
      buildDashboardKPIPanels([
        getVisStateHorizontalBarByField(
          indexPatternId,
          'user.name',
          'Top 5 users',
          'it-hygiene-users',
          { fieldCustomLabel: 'Users' },
        ),
        getVisStateHorizontalBarByField(
          indexPatternId,
          'user.groups',
          'Top 5 user groups',
          'it-hygiene-users',
          { fieldCustomLabel: 'User groups' },
        ),
        getVisStateHorizontalBarByField(
          indexPatternId,
          'user.shell',
          'Top 5 user shells',
          'it-hygiene-users',
          { fieldCustomLabel: 'User shells' },
        ),
      ]),
    ).map(panel => ({
      gridData: panel.gridData,
      savedVis: panel.explicitInput.savedVis,
    }));

    this.setGridVisualizationPairs(...panels);
  }
}

export class ITHygieneUsersInventoriesUsersDashboardByRendererConfig extends DashboardByRendererConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new ITHygieneUsersInventoriesUsersDashboardLayoutDefinition(
        indexPatternId,
      ),
    );
  }

  protected override getId(): string {
    return 'it-hygiene-user-inventories-users-dashboard-tab';
  }
  protected override getTitle(): string {
    return 'IT Hygiene - User Inventories - Users';
  }
  protected override getDescription(): string {
    return 'Dashboard of IT Hygiene User Inventories - Users';
  }
}

export class ITHygieneUsersInventoriesUsersDashboardPanelsService {
  private static getOverviewDashboardPanels = (
    indexPatternId: string,
  ): DashboardByRendererPanels => {
    return new ITHygieneUsersInventoriesUsersDashboardByRendererConfig(
      indexPatternId,
    ).getDashboardPanels();
  };

  public static getDashboardPanels(
    indexPatternId: string,
  ): DashboardByRendererPanels {
    return this.getOverviewDashboardPanels(indexPatternId);
  }
}
