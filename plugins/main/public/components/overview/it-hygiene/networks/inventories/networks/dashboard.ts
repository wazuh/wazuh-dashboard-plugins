import { buildDashboardKPIPanels } from '../../../common/create-dashboard-panels-kpis';
import { generateVisualization } from '../../../common/create-new-visualization';
import { HEIGHT, STYLE } from '../../../common/saved-vis/constants';
import {
  createIndexPatternReferences,
  createSearchSource,
} from '../../../common/saved-vis/create-saved-vis-data';
import { getVisStateDonutByField } from '../../../common/saved-vis/generators';
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
    title: 'Unique networks IPs',
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

const getVisStateUDPOnlyInterfacesMetric = (
  indexPatternId: string,
): SavedVis => {
  return {
    id: 'it-hygiene-network-interfaces-only-udp',
    title: 'Interfaces operating only on UDP',
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
          type: 'count',
          params: {
            customLabel: 'UDP',
          },
          schema: 'metric',
        },
        {
          id: '2',
          enabled: true,
          type: 'filters',
          params: {
            filters: [
              {
                input: {
                  query: 'network.protocol:"UDP"',
                  language: 'kuery',
                },
                label: 'Protocols',
              },
            ],
          },
          schema: 'group',
        },
      ],
    },
  };
};

export const getOverviewNetworksNetworksTab = (indexPatternId: string) => {
  return buildDashboardKPIPanels([
    getVisStateDonutByField(
      indexPatternId,
      'network.protocol',
      'Protocols',
      'it-hygiene-networks',
    ),
    getVisStateDHCPEnabledInterfacesMetric(indexPatternId),
    getVisStateUniqueNetworkIPsMetric(indexPatternId),
  ]);
};
