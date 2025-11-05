import {
  buildDashboardKPIPanels,
  getVisStateHorizontalBarByField,
  getVisStateHorizontalBarSplitSeries,
} from '../../../../../../lib';
import {
  DashboardByRendererConfig,
  DashboardLayoutDefinition,
} from '../../../../../../lib/dashboard-config-service';

export class ITHygieneNetworksInventoriesServicesDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();

    const panels = Object.values(
      buildDashboardKPIPanels([
        getVisStateHorizontalBarSplitSeries(
          indexPatternId,
          'source.port',
          'Top 5 source ports',
          'it-hygiene-ports',
          {
            fieldSize: 5,
            metricCustomLabel: 'Top ports count',
            valueAxesTitleText: ' ',
            seriesLabel: 'Top ports',
            seriesMode: 'normal',
            fieldCustomLabel: 'Top ports',
          },
        ),
        getVisStateHorizontalBarSplitSeries(
          indexPatternId,
          'network.transport',
          'Transport protocols',
          'it-hygiene-ports',
          {
            fieldSize: 4,
            otherBucket: 'Others',
            metricCustomLabel: 'Transport protocols count',
            valueAxesTitleText: ' ',
            seriesLabel: 'Transport protocols',
            seriesMode: 'stacked',
            fieldCustomLabel: 'Transport protocols',
          },
        ),
        getVisStateHorizontalBarByField(
          indexPatternId,
          'process.name',
          'Top 5 processes',
          'it-hygiene-ports',
          { fieldCustomLabel: 'Processes' },
        ),
      ]),
    ).map(panel => ({
      gridData: panel.gridData,
      savedVis: panel.explicitInput.savedVis,
    }));

    this.setGridVisualizationPairs(...panels);
  }
}

export class ITHygieneNetworksInventoriesServicesDashboardByRendererConfig extends DashboardByRendererConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new ITHygieneNetworksInventoriesServicesDashboardLayoutDefinition(
        indexPatternId,
      ),
    );
  }

  protected override getId(): string {
    return 'it-hygiene-networks-inventories-services-dashboard-tab';
  }
  protected override getTitle(): string {
    return 'IT Hygiene - Networks Inventories - Services';
  }
  protected override getDescription(): string {
    return 'Dashboard of IT Hygiene Networks Inventories - Services';
  }
}
