import {
  buildDashboardKPIPanels,
  getVisStateHorizontalBarSplitSeries,
  getVisStateMetricUniqueCountByField,
} from '../../../../../../lib';
import {
  DashboardConfig,
  DashboardLayoutDefinition,
} from '../../../../../../lib/dashboard-config-service';
import { getVisStateFilter } from './vis-states';

export class ITHygienePackagesInventoriesPackagesDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();

    const panels = Object.values(
      buildDashboardKPIPanels([
        getVisStateFilter(
          'Vendors',
          indexPatternId,
          '',
          'Top 5 vendors',
          'package.vendor',
        ),
        getVisStateMetricUniqueCountByField(
          indexPatternId,
          'package.name',
          '',
          'it-hygiene-packages',
          'Unique packages',
        ),
        getVisStateHorizontalBarSplitSeries(
          indexPatternId,
          'package.type',
          'Package types',
          'it-hygiene-packages',
          {
            fieldSize: 4,
            otherBucket: 'Others',
            metricCustomLabel: 'Package type count',
            valueAxesTitleText: ' ',
            seriesLabel: 'Package type count',
            fieldCustomLabel: 'Package type',
          },
        ),
      ]),
    ).map(panel => ({
      gridData: panel.gridData,
      savedVis: panel.explicitInput.savedVis,
    }));

    this.setGridVisualizationPairs(...panels);
  }
}

export class ITHygienePackagesInventoriesPackagesDashboardConfig extends DashboardConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new ITHygienePackagesInventoriesPackagesDashboardLayoutDefinition(
        indexPatternId,
      ),
    );
  }

  protected override getId(): string {
    return 'it-hygiene-packages-inventories-packages-dashboard-tab';
  }
  protected override getTitle(): string {
    return 'IT Hygiene - Packages Inventories - Packages';
  }
  protected override getDescription(): string {
    return 'Dashboard of IT Hygiene Packages Inventories - Packages';
  }
}
