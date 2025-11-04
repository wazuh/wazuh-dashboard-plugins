import { SavedVis } from '../../../../../../../common/dashboards/types';
import {
  buildDashboardKPIPanels,
  buildIndexPatternReferenceList,
  buildSearchSource,
  getVisStateHorizontalBarByField,
  getVisStateHorizontalBarSplitSeries,
  STYLE,
} from '../../../../../../../common/dashboards/lib';

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
      searchSource: buildSearchSource(indexPatternId),
      references: buildIndexPatternReferenceList(indexPatternId),
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
  ]);
};
