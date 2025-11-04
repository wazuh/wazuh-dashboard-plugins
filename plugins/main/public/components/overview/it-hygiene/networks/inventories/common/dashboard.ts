import { SavedVis } from '../../../../../../../common/dashboards/types';
import {
  buildIndexPatternReferenceList,
  buildSearchSource,
  STYLE,
} from '../../../../../../../common/dashboards/lib';

export const getVisStateNetworkAveragePriorityMetric = (
  indexPatternId: string,
): SavedVis => {
  return {
    id: 'it-hygiene-network-average-priority-of-routes',
    title: 'Monitor the average priority of routes',
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
          type: 'avg',
          params: {
            field: 'network.metric',
            customLabel: 'Average priority of routes',
          },
          schema: 'metric',
        },
      ],
    },
  };
};

export const getVisStateDHCPEnabledInterfacesMetric = (
  indexPatternId: string,
): SavedVis => {
  return {
    id: 'it-hygiene-network-interfaces-with-dhcp-enabled',
    title: 'Interfaces with DHCP enabled',
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
          type: 'count',
          params: {
            customLabel: 'enabled',
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
                  query: 'network.dhcp:true',
                  language: 'kuery',
                },
                label: 'DHCP',
              },
            ],
          },
          schema: 'group',
        },
      ],
    },
  };
};
