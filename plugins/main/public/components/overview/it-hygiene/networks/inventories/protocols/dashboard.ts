import { buildDashboardKPIPanels } from '../../../common/create-dashboard-panels-kpis';
import { STYLE } from '../../../common/saved-vis/constants';
import {
  createIndexPatternReferences,
  createSearchSource,
} from '../../../common/saved-vis/create-saved-vis-data';
import { getVisStateDonutByField } from '../../../common/saved-vis/generators';
import { SavedVis } from '../../../common/types';
const getVisStateNetworkMetricsMinMax = (indexPatternId: string): SavedVis => {
  return {
    id: 'it-hygiene-network-metrics-min-max',
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
        style: {
          bgFill: '#000',
          bgColor: false,
          labelColor: false,
          subText: '',
          fontSize: 40,
        },
      },
    },
    data: {
      searchSource: createSearchSource(indexPatternId),
      references: createIndexPatternReferences(indexPatternId),
      aggs: [
        {
          id: '1',
          enabled: true,
          type: 'min',
          params: {
            field: 'network.metric',
            customLabel: 'Min network metric',
          },
          schema: 'metric',
        },
        {
          id: '2',
          enabled: true,
          type: 'max',
          params: {
            field: 'network.metric',
            customLabel: 'Max network metric',
          },
          schema: 'metric',
        },
      ],
    },
  };
};

export const getOverviewNetworksProtocolsTab = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStateDonutByField(
      indexPatternId,
      'network.dhcp',
      'DHCP',
      'it-hygiene-protocols',
    ),
    getVisStateNetworkMetricsMinMax(indexPatternId),
    getVisStateDonutByField(
      indexPatternId,
      'network.type',
      'Types',
      'it-hygiene-protocols',
    ),
  ]);
};
