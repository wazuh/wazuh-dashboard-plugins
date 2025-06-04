import { buildDashboardKPIPanels } from '../../../common/create-dashboard-panels-kpis';
import { HEIGHT, STYLE } from '../../../common/saved-vis/constants';
import {
  createIndexPatternReferences,
  createSearchSource,
} from '../../../common/saved-vis/create-saved-vis-data';
import { getVisStateHorizontalBarSplitSeries } from '../../../../../../services/visualizations';
import { getVisStateHorizontalBarByField } from '../../../common/saved-vis/generators';
import { SavedVis } from '../../../common/types';
import {
  getVisStateDHCPEnabledInterfacesMetric,
  getVisStateNetworkAveragePriorityMetric,
} from '../common/dashboard';

const getVisStateUniqueNetworkIPsMetric = (
  indexPatternId: string,
): SavedVis => {
  return {
    id: 'it-hygiene-network-by-ip',
    title: 'Unique network IPs',
    type: 'metric',
    params: {
      addTooltip: true,
      addLegend: false,
      type: 'metric',
      metric: {
        percentageMode: false,
        useRanges: false,
        colorSchema: 'Green to Red',
        metricColorMode: 'None',
        colorsRange: [
          {
            from: 0,
            to: 10000,
          },
        ],
        labels: {
          show: true,
        },
        invertColors: false,
        style: STYLE,
      },
    },
    data: {
      searchSource: createSearchSource(indexPatternId),
      references: createIndexPatternReferences(indexPatternId),
      aggs: [
        {
          id: '1',
          enabled: true,
          type: 'cardinality',
          params: {
            field: 'network.ip',
            customLabel: 'Unique networks',
          },
          schema: 'metric',
        },
      ],
    },
  };
};

export const getOverviewNetworksNetworksTab = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStateHorizontalBarSplitSeries(
      indexPatternId,
      'network.type',
      'Network type',
      'it-hygiene-networks',
      {
        fieldSize: 4,
        otherBucket: 'Others',
        metricCustomLabel: 'Network type count',
        valueAxesTitleText: 'Network type count',
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
      { customLabel: 'Interface name' },
    ),
  ]);
};
