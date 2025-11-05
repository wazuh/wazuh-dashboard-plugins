import {
  buildDashboardKPIPanels,
  getVisStateHorizontalBarSplitSeries,
  getVisStateTable,
} from '../../../../lib';
import {
  DashboardByRendererConfig,
  DashboardLayoutDefinition,
} from '../../../../lib/dashboard-config-service';

export class FimFilesDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();

    const panels = Object.values(
      buildDashboardKPIPanels([
        getVisStateTable(
          indexPatternId,
          'file.path',
          '',
          'fim-files-inventory',
          {
            size: 5,
            fieldCustomLabel: 'Top 5 file paths',
          },
        ),
        getVisStateHorizontalBarSplitSeries(
          indexPatternId,
          'file.owner',
          'File owners',
          'fim-files-inventory',
          {
            fieldSize: 4,
            otherBucket: 'Others',
            metricCustomLabel: 'File owner count',
            valueAxesTitleText: ' ',
            seriesLabel: 'File owner count',
            fieldCustomLabel: 'File owner',
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

export class FimFilesDashboardByRendererConfig extends DashboardByRendererConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new FimFilesDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'fim-files-dashboard';
  }

  protected override getTitle(): string {
    return 'File Integrity Monitoring Files';
  }

  protected override getDescription(): string {
    return 'Dashboard for File Integrity Monitoring (FIM) Files';
  }
}
