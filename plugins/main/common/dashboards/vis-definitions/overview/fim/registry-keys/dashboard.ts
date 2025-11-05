import {
  buildDashboardKPIPanels,
  getVisStateHorizontalBarSplitSeries,
  getVisStateTable,
} from '../../../../lib';
import {
  DashboardConfig,
  DashboardLayoutDefinition,
} from '../../../../lib/dashboard-config-service';

export class FimRegistryKeysDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();

    const panels = Object.values(
      buildDashboardKPIPanels([
        getVisStateTable(
          indexPatternId,
          'registry.path',
          '',
          'registry-keys-inventory',
          {
            size: 5,
            fieldCustomLabel: 'Top 5 registry paths',
          },
        ),
        getVisStateHorizontalBarSplitSeries(
          indexPatternId,
          'registry.owner',
          'Registry owners',
          'registry-keys-inventory',
          {
            fieldSize: 4,
            otherBucket: 'Others',
            metricCustomLabel: 'Registry owner count',
            valueAxesTitleText: ' ',
            fieldCustomLabel: 'Registry owner',
            seriesLabel: 'Registry owner',
          },
        ),
        getVisStateHorizontalBarSplitSeries(
          indexPatternId,
          'registry.group',
          'Registry groups',
          'registry-keys-inventory',
          {
            fieldSize: 4,
            otherBucket: 'Others',
            metricCustomLabel: 'Registry groups count',
            valueAxesTitleText: ' ',
            fieldCustomLabel: 'Registry group',
            seriesLabel: 'Registry group',
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

export class FimRegistryKeysDashboardConfig extends DashboardConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new FimRegistryKeysDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'fim-registry-keys-dashboard';
  }

  protected override getTitle(): string {
    return 'File Integrity Monitoring Registry Keys';
  }

  protected override getDescription(): string {
    return 'Dashboard for File Integrity Monitoring (FIM) Registry Keys';
  }
}
