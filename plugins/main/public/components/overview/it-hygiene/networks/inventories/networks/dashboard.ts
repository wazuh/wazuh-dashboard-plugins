import { buildDashboardKPIPanels } from '../../../common/create-dashboard-panels-kpis';
import { getVisStateHorizontalBarSplitSeries } from '../../../../../../services/visualizations';
import { getVisStateHorizontalBarByField } from '../../../common/saved-vis/generators';

export const getOverviewNetworksNetworksTab = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
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
    getVisStateHorizontalBarByField(
      indexPatternId,
      'network.ip',
      'Top 5 networks',
      'it-hygiene-networks',
      { customLabel: 'Network IP' },
    ),
    getVisStateHorizontalBarByField(
      indexPatternId,
      'interface.name',
      'Top 5 interface names',
      'it-hygiene-networks',
      { customLabel: 'Interface name' },
    ),
  ]);
};
