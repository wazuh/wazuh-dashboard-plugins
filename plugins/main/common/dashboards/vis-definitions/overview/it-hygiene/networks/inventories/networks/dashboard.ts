import {
  buildDashboardKPIPanels,
  getVisStateHorizontalBarByField,
  getVisStateHorizontalBarSplitSeries,
} from '../../../../../../lib';
import { DashboardConfig, DashboardLayoutDefinition } from '../../../../../../lib/dashboard-config-service';
import { getVisStateUniqueNetworkIPsMetric } from './vis-states';

export class ITHygieneNetworksInventoriesNetworksDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();

    const panels = Object.values(
      buildDashboardKPIPanels([
        getVisStateHorizontalBarSplitSeries(
          indexPatternId,
          'network.type',
          'Network types',
          'it-hygiene-networks',
          {
            fieldSize: 4,
            otherBucket: 'Others',
            metricCustomLabel: 'Network type count',
            valueAxesTitleText: ' ',
            seriesLabel: 'Type',
            seriesMode: 'stacked',
            fieldCustomLabel: 'Type',
          },
        ),
        getVisStateUniqueNetworkIPsMetric(indexPatternId),
        getVisStateHorizontalBarByField(
          indexPatternId,
          'interface.name',
          'Top 5 interface names',
          'it-hygiene-networks',
          { fieldCustomLabel: 'Interface name' },
        ),
      ]),
    ).map(panel => ({
      gridData: panel.gridData,
      savedVis: panel.explicitInput.savedVis,
    }));

    this.setGridVisualizationPairs(...panels);
  }
}

export class ITHygieneNetworksInventoriesNetworksDashboardConfig extends DashboardConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new ITHygieneNetworksInventoriesNetworksDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'it-hygiene-networks-inventories-networks-dashboard-tab';
  }
  protected override getTitle(): string {
    return 'IT Hygiene Networks Inventories - Networks';
  }
  protected override getDescription(): string {
    return 'Dashboard of IT Hygiene Networks Inventories - Networks';
  }
}