import {
  buildDashboardKPIPanels,
  getVisStateHorizontalBarSplitSeries,
} from '../../../../../../lib';
import {
  DashboardByRendererConfig,
  DashboardLayoutDefinition,
} from '../../../../../../lib/dashboard-config-service';
import { getVisStateGlobalPacketLossMetric } from './vis-states';

class ITHygieneNetworksInventoriesInterfacesDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();

    const panels = Object.values(
      buildDashboardKPIPanels([
        getVisStateGlobalPacketLossMetric(indexPatternId),
        getVisStateHorizontalBarSplitSeries(
          indexPatternId,
          'interface.state',
          'Interface states',
          'it-hygiene-interfaces',
          {
            fieldSize: 4,
            otherBucket: 'Others',
            metricCustomLabel: 'Interfaces state count',
            valueAxesTitleText: ' ',
            seriesLabel: 'Interfaces state',
            seriesMode: 'stacked',
            fieldCustomLabel: 'Interfaces state',
          },
        ),
        getVisStateHorizontalBarSplitSeries(
          indexPatternId,
          'interface.type',
          'Interface types',
          'it-hygiene-interfaces',
          {
            fieldSize: 4,
            otherBucket: 'Others',
            metricCustomLabel: 'Interfaces type count',
            valueAxesTitleText: ' ',
            seriesLabel: 'Type',
            seriesMode: 'stacked',
            fieldCustomLabel: 'Type',
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

export class ITHygieneNetworksInventoriesInterfacesDashboardByRendererConfig extends DashboardByRendererConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new ITHygieneNetworksInventoriesInterfacesDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'it-hygiene-networks-inventories-interfaces-dashboard-tab';
  }
  protected override getTitle(): string {
    return 'IT Hygiene - Networks Inventories - Interfaces';
  }
  protected override getDescription(): string {
    return 'Dashboard of IT Hygiene Networks Inventories - Interfaces.';
  }
}
