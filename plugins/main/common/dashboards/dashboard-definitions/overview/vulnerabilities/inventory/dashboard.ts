import {
  buildDashboardKPIPanels,
  getVisStateHorizontalBarByField,
  getVisStateHorizontalBarSplitSeries,
} from '../../../../lib';
import {
  DashboardConfig,
  DashboardLayoutDefinition,
} from '../../../../lib/dashboard-config-service';

export class VulnerabilitiesInventoryDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();
    const panels = Object.values(
      buildDashboardKPIPanels([
        getVisStateHorizontalBarByField(
          indexPatternId,
          'vulnerability.id',
          'Top 5 vulnerabilities',
          'vulnerability-detection-inventory',
          { customLabel: 'Vulnerability' },
        ),
        getVisStateHorizontalBarSplitSeries(
          indexPatternId,
          'vulnerability.severity',
          'Severity',
          'vulnerability-detection-inventory',
          {
            fieldSize: 5,
            metricCustomLabel: 'Count',
            valueAxesTitleText: ' ',
            seriesLabel: 'Severity',
            seriesMode: 'stacked',
            fieldCustomLabel: 'Severity',
            uiState: { vis: { colors: {} } },
          },
        ),
        getVisStateHorizontalBarByField(
          indexPatternId,
          'package.name',
          'Top 5 package name',
          'vulnerability-detection-inventory',
          { customLabel: 'Package name' },
        ),
      ]),
    ).map(panel => ({
      gridData: panel.gridData,
      savedVis: panel.explicitInput.savedVis,
    }));
    this.setGridVisualizationPairs(...panels);
  }
}

export class VulnerabilitiesInventoryDashboardConfig extends DashboardConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new VulnerabilitiesInventoryDashboardLayoutDefinition(indexPatternId),
    );
  }
  protected override getId(): string {
    return 'vulnerabilities-inventory-dashboard-tab';
  }
  protected override getTitle(): string {
    return 'Vulnerabilities Inventory';
  }
  protected override getDescription(): string {
    return 'Dashboard of Vulnerabilities Inventory';
  }
}
