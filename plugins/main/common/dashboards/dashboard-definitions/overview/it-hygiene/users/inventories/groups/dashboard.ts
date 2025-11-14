import {
  buildDashboardKPIPanels,
  getVisStateHorizontalBarByField,
  getVisStateMetricUniqueCountByField,
} from '../../../../../../lib';
import {
  DashboardConfig,
  DashboardLayoutDefinition,
} from '../../../../../../lib/dashboard-config-service';
import type { DashboardByRendererPanels } from '../../../../../../types';

export class ITHygieneUsersInventoriesGroupsDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();

    const panels = Object.values(
      buildDashboardKPIPanels([
        getVisStateHorizontalBarByField(
          indexPatternId,
          'group.name',
          'Top 5 groups',
          'it-hygiene-groups',
          { fieldCustomLabel: 'Groups' },
        ),
        getVisStateMetricUniqueCountByField(
          indexPatternId,
          'group.name',
          'Unique groups',
          'it-hygiene-groups-unique-count',
          'Unique groups',
        ),
      ]),
    ).map(panel => ({
      gridData: panel.gridData,
      savedVis: panel.explicitInput.savedVis,
    }));

    this.setGridVisualizationPairs(...panels);
  }
}

export class ITHygieneUsersInventoriesGroupsDashboardConfig extends DashboardConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new ITHygieneUsersInventoriesGroupsDashboardLayoutDefinition(
        indexPatternId,
      ),
    );
  }

  protected override getId(): string {
    return 'it-hygiene-user-inventories-groups-dashboard-tab';
  }
  protected override getTitle(): string {
    return 'IT Hygiene - User Inventories - Groups';
  }
  protected override getDescription(): string {
    return 'Dashboard of IT Hygiene User Inventories - Groups';
  }
}

export class ITHygieneUsersInventoriesGroupsDashboardPanelsService {
  private static getOverviewDashboardPanels = (
    indexPatternId: string,
  ): DashboardByRendererPanels => {
    return new ITHygieneUsersInventoriesGroupsDashboardConfig(
      indexPatternId,
    ).getDashboardPanels();
  };

  public static getDashboardPanels(
    indexPatternId: string,
  ): DashboardByRendererPanels {
    return this.getOverviewDashboardPanels(indexPatternId);
  }
}
