import { generateVisualization } from '../../../common/create-new-visualization';
import { STYLE } from '../../../common/saved-vis/constants';
import {
  createIndexPatternReferences,
  createSearchSource,
} from '../../../common/saved-vis/create-saved-vis-data';
import { SavedVis } from '../../../common/types';

const getVisStateNetworkByIP = (indexPatternId: string): SavedVis => {
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

const getVisStateNetworkAveragePriorityOfRoutes = (
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
      searchSource: createSearchSource(indexPatternId),
      references: createIndexPatternReferences(indexPatternId),
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

const getVisStateNetworkPorcentageOfUDPTraffic = (
  indexPatternId: string,
): SavedVis => {
  return {
    id: 'it-hygiene-porcentage-of-udp-traffic',
    title: 'KPI - % of UDP Traffic',
    type: 'metrics',
    params: {
      id: '61ca57f0-469d-11e7-af02-69e470af7417',
      addTooltip: true,
      addLegend: false,
      type: 'metric',
      metric: {
        percentageMode: true,
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
      series: [
        {
          id: '61ca57f1-469d-11e7-af02-69e470af7417',
          color: '#000',
          split_mode: 'everything',
          split_color_mode: 'opensearchDashboards',
          metrics: [
            {
              id: '61ca57f2-469d-11e7-af02-69e470af7417',
              type: 'filter_ratio',
              numerator: {
                query: 'network.protocol: UDP',
                language: 'kuery',
              },
              denominator: {
                query: '*',
                language: 'kuery',
              },
              metric_agg: 'count',
            },
          ],
          separate_axis: 0,
          axis_position: 'right',
          axis_scale: 'normal',
          formatter: 'percent',
          chart_type: 'line',
          line_width: 1,
          point_size: 1,
          fill: 0.5,
          stacked: 'none',
          label: 'UDP Traffic',
          filter: {
            query: 'network.protocol: *',
            language: 'kuery',
          },
          value_template: '',
          offset_time: '',
        },
      ],
      time_field: '@timestamp',
      index_pattern: indexPatternId,
      interval: '',
      axis_position: 'left',
      axis_formatter: 'number',
      axis_scale: 'normal',
      show_legend: 1,
      show_grid: 1,
      tooltip_mode: 'show_all',
      default_index_pattern: 'wazuh-alerts-*',
      default_timefield: 'timestamp',
      isModelInvalid: false,
      time_range_mode: 'entire_time_range',
    },
    data: {
      searchSource: createSearchSource(indexPatternId),
      references: createIndexPatternReferences(indexPatternId),
      aggs: [],
    },
  };
};

const getVisStateNetworkInterfacesWithDHCPEnabled = (
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
      searchSource: createSearchSource(indexPatternId),
      references: createIndexPatternReferences(indexPatternId),
      aggs: [
        {
          id: '1',
          enabled: true,
          type: 'count',
          params: {
            customLabel: 'Interfaces',
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
                label: 'DHCP enabled',
              },
            ],
          },
          schema: 'group',
        },
      ],
    },
  };
};

export const getOverviewNetworksTab = (indexPatternId: string) => {
  return {
    ...generateVisualization({
      key: '0',
      width: 12,
      height: 6,
      positionX: 0,
      positionY: 0,
      savedVis: getVisStateNetworkByIP(indexPatternId),
    }),
    ...generateVisualization({
      key: '1',
      width: 12,
      height: 6,
      positionX: 12,
      positionY: 0,
      savedVis: getVisStateNetworkAveragePriorityOfRoutes(indexPatternId),
    }),
    ...generateVisualization({
      key: '2',
      width: 12,
      height: 6,
      positionX: 24,
      positionY: 6,
      savedVis: getVisStateNetworkPorcentageOfUDPTraffic(indexPatternId),
    }),
    ...generateVisualization({
      key: '3',
      width: 12,
      height: 6,
      positionX: 36,
      positionY: 6,
      savedVis: getVisStateNetworkInterfacesWithDHCPEnabled(indexPatternId),
    }),
  };
};
