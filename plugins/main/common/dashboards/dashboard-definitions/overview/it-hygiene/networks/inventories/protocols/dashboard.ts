import {
  buildDashboardKPIPanels,
  getVisStateHorizontalBarSplitSeries,
} from '../../../../../../lib';
import {
  DashboardConfig,
  DashboardLayoutDefinition,
} from '../../../../../../lib/dashboard-config-service';
import { getVisStateNetworkMetricsMinMax } from './vis-states';

export class ITHygieneNetworksInventoriesProtocolsDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();

    const panels = Object.values(
      buildDashboardKPIPanels([
        getVisStateHorizontalBarSplitSeries(
          indexPatternId,
          'network.type',
          'Network types',
          'it-hygiene-protocols',
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
        getVisStateNetworkMetricsMinMax(indexPatternId),
        getVisStateHorizontalBarSplitSeries(
          indexPatternId,
          'network.dhcp',
          'DHCP enabled',
          'it-hygiene-protocols',
          {
            fieldSize: 4,
            otherBucket: 'Others',
            metricCustomLabel: 'Network DHCP count',
            valueAxesTitleText: ' ',
            seriesLabel: 'DHCP enabled',
            seriesMode: 'stacked',
            fieldCustomLabel: 'DHCP enabled',
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

export class ITHygieneNetworksInventoriesProtocolsDashboardConfig extends DashboardConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new ITHygieneNetworksInventoriesProtocolsDashboardLayoutDefinition(
        indexPatternId,
      ),
    );
  }

  protected override getId(): string {
    return 'it-hygiene-networks-inventories-protocols-dashboard-tab';
  }
  protected override getTitle(): string {
    return 'IT Hygiene - Networks Inventories - Protocols';
  }
  protected override getDescription(): string {
    return 'Dashboard of IT Hygiene Networks Inventories - Protocols';
  }
}
