import {
  buildDashboardKPIPanels,
  getVisStateHorizontalBarByField,
  getVisStateHorizontalBarSplitSeries,
} from '../../../../../../lib';
import {
  DashboardConfig,
  DashboardLayoutDefinition,
} from '../../../../../../lib/dashboard-config-service';

export class ITHygieneNetworksInventoriesTrafficDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();

    const panels = Object.values(
      buildDashboardKPIPanels([
        getVisStateHorizontalBarSplitSeries(
          indexPatternId,
          'destination.port',
          'Top 5 destination ports',
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

export class ITHygieneNetworksInventoriesTrafficDashboardConfig extends DashboardConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new ITHygieneNetworksInventoriesTrafficDashboardLayoutDefinition(
        indexPatternId,
      ),
    );
  }

  protected override getId(): string {
    return 'it-hygiene-networks-inventories-traffic-dashboard-tab';
  }
  protected override getTitle(): string {
    return 'IT Hygiene - Networks Inventories - Traffic';
  }
  protected override getDescription(): string {
    return 'Dashboard of IT Hygiene Networks Inventories - Traffic';
  }
}
