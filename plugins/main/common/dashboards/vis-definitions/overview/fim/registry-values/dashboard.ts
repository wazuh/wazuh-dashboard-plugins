import {
  buildDashboardKPIPanels,
  getVisStateHorizontalBarSplitSeries,
  getVisStateTable,
} from '../../../../lib';
import {
  DashboardByRendererConfig,
  DashboardLayoutDefinition,
} from '../../../../lib/dashboard-config-service';

export class FimRegistryValuesDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();

    const panels = Object.values(
      buildDashboardKPIPanels([
        getVisStateTable(
          indexPatternId,
          'registry.path',
          '',
          'registry-values-inventory',
          {
            size: 5,
            fieldCustomLabel: 'Top 5 registry paths',
          },
        ),
        getVisStateTable(
          indexPatternId,
          'registry.value',
          '',
          'registry-values-inventory',
          {
            size: 5,
            fieldCustomLabel: 'Top 5 registry values',
          },
        ),
        getVisStateHorizontalBarSplitSeries(
          indexPatternId,
          'registry.data.type',
          'Data types',
          'registry-values-inventory',
          {
            fieldSize: 4,
            otherBucket: 'Others',
            metricCustomLabel: 'Registry data type count',
            valueAxesTitleText: ' ',
            fieldCustomLabel: 'Registry data type',
            seriesLabel: 'Registry data type',
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

export class FimRegistryValuesDashboardByRendererConfig extends DashboardByRendererConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new FimRegistryValuesDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'fim-registry-values-dashboard';
  }

  protected override getTitle(): string {
    return 'File Integrity Monitoring Registry Values';
  }

  protected override getDescription(): string {
    return 'Dashboard for File Integrity Monitoring (FIM) Registry Values';
  }
}
