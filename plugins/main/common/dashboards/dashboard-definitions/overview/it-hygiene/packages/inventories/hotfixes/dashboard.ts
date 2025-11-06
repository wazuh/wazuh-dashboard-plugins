import {
  buildDashboardKPIPanels,
  getVisStateHorizontalBarByField,
} from '../../../../../../lib';
import {
  DashboardConfig,
  DashboardLayoutDefinition,
} from '../../../../../../lib/dashboard-config-service';

export class ITHygienePackagesInventoriesHotFixesDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();

    const panels = Object.values(
      buildDashboardKPIPanels([
        getVisStateHorizontalBarByField(
          indexPatternId,
          'package.hotfix.name',
          'Most common KBs',
          'it-hygiene-hotfixes',
          { fieldCustomLabel: 'KBs' },
        ),
        getVisStateHorizontalBarByField(
          indexPatternId,
          'package.hotfix.name',
          'Least common KBs',
          'it-hygiene-hotfixes',
          { fieldCustomLabel: 'KBs', orderAggregation: 'asc' },
        ),
      ]),
    ).map(panel => ({
      gridData: panel.gridData,
      savedVis: panel.explicitInput.savedVis,
    }));

    this.setGridVisualizationPairs(...panels);
  }
}

export class ITHygienePackagesInventoriesHotFixesDashboardConfig extends DashboardConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new ITHygienePackagesInventoriesHotFixesDashboardLayoutDefinition(
        indexPatternId,
      ),
    );
  }

  protected override getId(): string {
    return 'it-hygiene-packages-inventories-hotfixes-dashboard-tab';
  }
  protected override getTitle(): string {
    return 'IT Hygiene - Packages Inventories - Hotfixes';
  }
  protected override getDescription(): string {
    return 'Dashboard of IT Hygiene Packages Inventories - Hotfixes';
  }
}
