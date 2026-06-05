import {
  buildDashboardKPIPanels,
  getVisStateHorizontalBarByField,
} from '../../../../../../lib';
import {
  DashboardConfig,
  DashboardLayoutDefinition,
} from '../../../../../../lib/dashboard-config-service';

export class ITHygienePackagesInventoriesBrowserExtensionsDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();

    const panels = Object.values(
      buildDashboardKPIPanels([
        getVisStateHorizontalBarByField(
          indexPatternId,
          'browser.name',
          'Top 5 browsers',
          'it-hygiene-browsers-name',
          { fieldCustomLabel: 'Browsers' },
        ),
        getVisStateHorizontalBarByField(
          indexPatternId,
          'package.name',
          'Top 5 packages',
          'it-hygiene-packages-name',
          { fieldCustomLabel: 'Packages' },
        ),
      ]),
    ).map(panel => ({
      gridData: panel.gridData,
      savedVis: panel.explicitInput.savedVis,
    }));

    this.setGridVisualizationPairs(...panels);
  }
}

export class ITHygienePackagesInventoriesBrowserExtensionsDashboardConfig extends DashboardConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new ITHygienePackagesInventoriesBrowserExtensionsDashboardLayoutDefinition(
        indexPatternId,
      ),
    );
  }

  protected override getId(): string {
    return 'it-hygiene-packages-inventories-browser-extensions-dashboard-tab';
  }
  protected override getTitle(): string {
    return 'IT Hygiene - Packages Inventories - Browser Extensions';
  }
  protected override getDescription(): string {
    return 'Dashboard of IT Hygiene Packages Inventories - Browser Extensions';
  }
}
