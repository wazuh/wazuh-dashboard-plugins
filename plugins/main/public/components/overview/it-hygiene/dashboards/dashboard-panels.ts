import { DashboardPanelState } from '../../../../../../../../src/plugins/dashboard/public/application';
import { EmbeddableInput } from '../../../../../../../../src/plugins/embeddable/public';
import {
  getVisStateDonutByField,
  getVisStateHistogramBy,
} from '../common/saved-vis/generators';
import { getVisStateHorizontalBarSplitSeries } from '../../../../services/visualizations';

const getVisStateProcessesByInterfaceState = (indexPatternId: string) => {
  return {
    id: 'it-hygiene-processes-by-interface-state',
    title: 'Top processes by interface state',
    type: 'histogram',
    params: {
      addLegend: true,
      addTimeMarker: false,
      addTooltip: true,
      categoryAxes: [
        {
          id: 'CategoryAxis-1',
          labels: {
            filter: true,
            show: true,
            truncate: 100,
            rotate: 75,
          },
          position: 'bottom',
          scale: {
            type: 'linear',
          },
          show: true,
          style: {},
          title: {},
          type: 'category',
        },
      ],
      grid: {
        categoryLines: false,
      },
      labels: {
        show: false,
      },
      legendPosition: 'right',
      seriesParams: [
        {
          data: {
            id: '1',
            label: 'Count',
          },
          drawLinesBetweenPoints: true,
          lineWidth: 2,
          mode: 'stacked',
          show: true,
          showCircles: true,
          type: 'histogram',
          valueAxis: 'ValueAxis-1',
        },
      ],
      thresholdLine: {
        color: '#E7664C',
        show: false,
        style: 'full',
        value: 10,
        width: 1,
      },
      times: [],
      type: 'histogram',
      valueAxes: [
        {
          id: 'ValueAxis-1',
          labels: {
            filter: false,
            rotate: 0,
            show: true,
            truncate: 100,
          },
          name: 'LeftAxis-1',
          position: 'left',
          scale: {
            mode: 'normal',
            type: 'linear',
          },
          show: true,
          style: {},
          title: {
            text: 'Count',
          },
          type: 'value',
        },
      ],
    },
    data: {
      searchSource: {
        query: {
          language: 'kuery',
          query: '',
        },
        filter: [],
        index: indexPatternId,
      },
      references: [
        {
          name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
          type: 'index-pattern',
          id: indexPatternId,
        },
      ],
      aggs: [
        {
          id: '1',
          enabled: true,
          type: 'count',
          params: {},
          schema: 'metric',
        },
        {
          id: '4',
          enabled: true,
          type: 'terms',
          params: {
            field: 'interface.state',
            orderBy: '_key',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
          },
          schema: 'segment',
        },
        {
          id: '3',
          enabled: true,
          type: 'terms',
          params: {
            field: 'process.name',
            orderBy: '_key',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
          },
          schema: 'group',
        },
      ],
    },
  };
};

const getVisStateAgentRemotePortByRemoteIP = (indexPatternId: string) => {
  return {
    id: 'it-hygiene-agent-remote-port-by-remote-ip',
    title: 'Top 5 remote ports by remote IP',
    type: 'pie',
    params: {
      type: 'pie',
      addTooltip: true,
      addLegend: true,
      legendPosition: 'right',
      isDonut: true,
      labels: {
        show: false,
        values: true,
        last_level: true,
        truncate: 100,
      },
    },
    data: {
      searchSource: {
        query: {
          language: 'kuery',
          query: '',
        },
        filter: [],
        index: indexPatternId,
      },
      references: [
        {
          name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
          type: 'index-pattern',
          id: indexPatternId,
        },
      ],
      aggs: [
        {
          id: '1',
          enabled: true,
          type: 'count',
          params: {},
          schema: 'metric',
        },
        {
          id: '2',
          enabled: true,
          type: 'terms',
          params: {
            field: 'source.ip',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
          },
          schema: 'segment',
        },
        {
          id: '3',
          enabled: true,
          type: 'terms',
          params: {
            field: 'source.port',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
          },
          schema: 'segment',
        },
      ],
    },
  };
};

const getVisStateUsedMemoryByPercentage = (indexPatternId: string) => {
  return {
    id: 'it-hygiene-used-memory-percentage',
    title: 'Min and max observer ingress interface name network metrics',
    type: 'horizontal_bar',
    params: {
      addLegend: true,
      addTimeMarker: false,
      addTooltip: true,
      categoryAxes: [
        {
          id: 'CategoryAxis-1',
          labels: {
            filter: false,
            rotate: 75,
            show: true,
            truncate: 20,
          },
          position: 'left',
          scale: {
            type: 'linear',
          },
          show: true,
          style: {},
          title: {},
          type: 'category',
        },
      ],
      grid: {
        categoryLines: false,
      },
      labels: {},
      legendPosition: 'right',
      orderBucketsBySum: false,
      seriesParams: [
        {
          data: {
            id: '1',
            label: 'Min network metric',
          },
          drawLinesBetweenPoints: true,
          lineWidth: 2,
          mode: 'normal',
          show: true,
          showCircles: true,
          type: 'histogram',
          valueAxis: 'ValueAxis-1',
        },
        {
          data: {
            id: '3',
            label: 'Max network metric',
          },
          drawLinesBetweenPoints: true,
          lineWidth: 2,
          mode: 'normal',
          show: true,
          showCircles: true,
          type: 'histogram',
          valueAxis: 'ValueAxis-1',
        },
      ],
      thresholdLine: {
        color: '#E7664C',
        show: false,
        style: 'full',
        value: 10,
        width: 1,
      },
      times: [],
      type: 'histogram',
      valueAxes: [
        {
          id: 'ValueAxis-1',
          labels: {
            filter: true,
            rotate: 75,
            show: true,
            truncate: 100,
          },
          name: 'LeftAxis-1',
          position: 'bottom',
          scale: {
            mode: 'normal',
            type: 'linear',
          },
          show: true,
          style: {},
          title: {
            text: 'Network metrics',
          },
          type: 'value',
        },
      ],
    },
    data: {
      searchSource: {
        query: {
          language: 'kuery',
          query: '',
        },
        filter: [],
        index: indexPatternId,
      },
      references: [
        {
          name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
          type: 'index-pattern',
          id: indexPatternId,
        },
      ],
      aggs: [
        {
          enabled: true,
          id: '1',
          params: {
            customLabel: 'Min network metric',
            field: 'network.metric',
          },
          schema: 'metric',
          type: 'min',
        },
        {
          enabled: true,
          id: '2',
          params: {
            customLabel: 'Observer ingress interface name',
            field: 'interface.name',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            order: 'asc',
            orderBy: '1',
            otherBucket: false,
            otherBucketLabel: 'Other',
            size: 5,
          },
          schema: 'segment',
          type: 'terms',
        },
        {
          enabled: true,
          id: '3',
          params: {
            customLabel: 'Max network metric',
            field: 'network.metric',
          },
          schema: 'metric',
          type: 'max',
        },
      ],
    },
  };
};

const getOverviewDashboardPanels = (
  indexPatternId: string,
): {
  [panelId: string]: DashboardPanelState<
    EmbeddableInput & { [k: string]: unknown }
  >;
} => {
  return {
    '1': {
      gridData: {
        w: 16,
        h: 12,
        x: 0,
        y: 6,
        i: '1',
      },
      type: 'visualization',
      explicitInput: {
        id: '1',
        savedVis: getVisStateDonutByField(
          indexPatternId,
          'interface.state',
          'TPC connection status',
          'it-hygiene-stat',
          'desc',
          {
            filter: [
              {
                $state: {
                  store: 'appState',
                },
                exists: {
                  field: 'interface.name',
                },
                meta: {
                  alias: null,
                  disabled: false,
                  key: 'interface.name',
                  negate: true,
                  type: 'exists',
                  value: 'exists',
                  index: indexPatternId,
                },
              },
            ],
          },
        ),
      },
    },
    '2': {
      gridData: {
        w: 16,
        h: 12,
        x: 16,
        y: 6,
        i: '2',
      },
      type: 'visualization',
      explicitInput: {
        id: '2',
        savedVis: getVisStateHorizontalBarSplitSeries(
          indexPatternId,
          'source.port',
          'Top 5 source ports',
          'it-hygiene-top-operating-system-names',
          {
            fieldSize: 5,
            metricCustomLabel: 'Top ports count',
            valueAxesTitleText: ' ',
            seriesLabel: 'Top ports',
            seriesMode: 'normal',
            fieldCustomLabel: 'Top ports',
          },
        ),
      },
    },
    '3': {
      gridData: {
        w: 16,
        h: 12,
        x: 32,
        y: 6,
        i: '3',
      },
      type: 'visualization',
      explicitInput: {
        id: '3',
        savedVis: getVisStateHistogramBy(
          indexPatternId,
          'process.start',
          'Processes start time',
          'it-hygiene-processes',
          'h',
          { addLegend: false, customLabel: ' ', valueAxesTitleText: '' },
        ),
      },
    },
  };
};

const getAgentDashboardPanels = (
  indexPatternId: string,
): {
  [panelId: string]: DashboardPanelState<
    EmbeddableInput & { [k: string]: unknown }
  >;
} => {
  return {
    a1: {
      gridData: {
        w: 16,
        h: 12,
        x: 0,
        y: 6,
        i: 'a1',
      },
      type: 'visualization',
      explicitInput: {
        id: 'a1',
        savedVis: getVisStateDonutByField(
          indexPatternId,
          'interface.state',
          'TPC connection status',
          'it-hygiene-stat',
          'desc',
          {
            filter: [
              {
                $state: {
                  store: 'appState',
                },
                exists: {
                  field: 'interface.name',
                },
                meta: {
                  alias: null,
                  disabled: false,
                  key: 'interface.name',
                  negate: true,
                  type: 'exists',
                  value: 'exists',
                  index: indexPatternId,
                },
              },
            ],
          },
        ),
      },
    },
    a2: {
      gridData: {
        w: 16,
        h: 12,
        x: 16,
        y: 6,
        i: 'a2',
      },
      type: 'visualization',
      explicitInput: {
        id: 'a2',
        savedVis: getVisStateHorizontalBarSplitSeries(
          indexPatternId,
          'source.port',
          'Top 5 source ports',
          'it-hygiene-top-operating-system-names',
          {
            fieldSize: 5,
            metricCustomLabel: 'Top ports count',
            valueAxesTitleText: ' ',
            seriesLabel: 'Top ports',
            seriesMode: 'normal',
            fieldCustomLabel: 'Top ports',
          },
        ),
      },
    },
    a3: {
      gridData: {
        w: 16,
        h: 12,
        x: 32,
        y: 6,
        i: 'a3',
      },
      type: 'visualization',
      explicitInput: {
        id: 'a3',
        savedVis: getVisStateHistogramBy(
          indexPatternId,
          'process.start',
          'Processes start time',
          'it-hygiene-processes',
          'h',
          { addLegend: false, customLabel: ' ', valueAxesTitleText: '' },
        ),
      },
    },
  };
};

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent: boolean,
): {
  [panelId: string]: DashboardPanelState<
    EmbeddableInput & { [k: string]: unknown }
  >;
} => {
  return isPinnedAgent
    ? getAgentDashboardPanels(indexPatternId)
    : getOverviewDashboardPanels(indexPatternId);
};
