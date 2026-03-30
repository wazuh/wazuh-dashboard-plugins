import { DashboardPanelState } from '../../../../../../../../src/plugins/dashboard/public/application';
import { EmbeddableInput } from '../../../../../../../../src/plugins/embeddable/public';

/* WARNING: The panel id must be unique including general and agents visualizations. Otherwise, the visualizations will not refresh when we pin an agent, because they are cached by id */

/* Overview visualizations */

const getVisStateTotalNumberOfBytesReceived = (indexPatternId?: string) => {
  return {
    id: 'Wazuh-App-Statistics-remoted-Recv-bytes',
    title: 'Total number of bytes received',
    type: 'line',
    params: {
      type: 'line',
      grid: {
        categoryLines: true,
      },
      categoryAxes: [
        {
          id: 'CategoryAxis-1',
          type: 'category',
          position: 'bottom',
          show: true,
          style: {},
          scale: {
            type: 'linear',
          },
          labels: {
            show: true,
            filter: true,
            truncate: 100,
          },
          title: {},
        },
      ],
      valueAxes: [
        {
          id: 'ValueAxis-1',
          name: 'LeftAxis-1',
          type: 'value',
          position: 'left',
          show: true,
          style: {},
          scale: {
            type: 'linear',
            mode: 'normal',
          },
          labels: {
            show: true,
            rotate: 0,
            filter: false,
            truncate: 100,
          },
          title: {
            text: 'Count',
          },
        },
      ],
      seriesParams: [
        {
          show: true,
          type: 'line',
          mode: 'normal',
          data: {
            label: 'Count',
            id: '1',
          },
          valueAxis: 'ValueAxis-1',
          drawLinesBetweenPoints: true,
          lineWidth: 2,
          interpolate: 'linear',
          showCircles: true,
        },
      ],
      addTooltip: true,
      addLegend: true,
      legendPosition: 'right',
      times: [],
      addTimeMarker: false,
      labels: {},
      thresholdLine: {
        show: false,
        value: 10,
        width: 1,
        style: 'full',
        color: '#E7664C',
      },
      // row: true,
    },
    uiState: {
      vis: {
        colors: {
          'network.ingress.bytes': '#70DBED', // prettier-ignore
        },
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
          type: 'avg',
          params: {
            field: 'network.ingress.bytes',
            customLabel: 'Count',
          },
          schema: 'metric',
        },
        {
          id: '2',
          enabled: true,
          type: 'date_histogram',
          params: {
            field: '@timestamp',
            timeRange: {
              from: 'now-24h',
              to: 'now',
            },
            useNormalizedOpenSearchInterval: true,
            scaleMetricValues: false,
            interval: 'auto',
            drop_partials: false,
            min_doc_count: 1,
            extended_bounds: {},
            customLabel: '@timestamp',
          },
          schema: 'segment',
        },
        {
          id: '3',
          enabled: true,
          type: 'filters',
          params: {
            filters: [
              {
                input: {
                  query: 'network.ingress.bytes:*',
                  language: 'kuery',
                },
                label: 'network.ingress.bytes',
              },
            ],
          },
          schema: 'group',
        },
      ],
    },
  };
};

const getVisStateEventsSentToAnalysisd = (indexPatternId?: string) => {
  return {
    id: 'Wazuh-App-Statistics-remoted-event-count',
    title: 'Events sent to Analysisd',
    type: 'line',
    params: {
      type: 'line',
      grid: {
        categoryLines: true,
      },
      categoryAxes: [
        {
          id: 'CategoryAxis-1',
          type: 'category',
          position: 'bottom',
          show: true,
          style: {},
          scale: {
            type: 'linear',
          },
          labels: {
            show: true,
            filter: true,
            truncate: 100,
          },
          title: {},
        },
      ],
      valueAxes: [
        {
          id: 'ValueAxis-1',
          name: 'LeftAxis-1',
          type: 'value',
          position: 'left',
          show: true,
          style: {},
          scale: {
            type: 'linear',
            mode: 'normal',
          },
          labels: {
            show: true,
            rotate: 0,
            filter: false,
            truncate: 100,
          },
          title: {
            text: 'Count',
          },
        },
      ],
      seriesParams: [
        {
          show: true,
          type: 'line',
          mode: 'normal',
          data: {
            label: 'Count',
            id: '1',
          },
          valueAxis: 'ValueAxis-1',
          drawLinesBetweenPoints: true,
          lineWidth: 2,
          interpolate: 'linear',
          showCircles: true,
        },
      ],
      addTooltip: true,
      addLegend: true,
      legendPosition: 'right',
      times: [],
      addTimeMarker: false,
      labels: {},
      thresholdLine: {
        show: false,
        value: 10,
        width: 1,
        style: 'full',
        color: '#E7664C',
      },
    },
    uiState: {
      vis: {
        colors: {
          'events.total': '#70DBED', // prettier-ignore
        },
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
          type: 'avg',
          params: {
            field: 'events.total',
            customLabel: 'Count',
          },
          schema: 'metric',
        },
        {
          id: '2',
          enabled: true,
          type: 'date_histogram',
          params: {
            field: '@timestamp',
            timeRange: {
              from: 'now-30m',
              to: 'now',
            },
            useNormalizedOpenSearchInterval: true,
            scaleMetricValues: false,
            interval: 'auto',
            drop_partials: false,
            min_doc_count: 1,
            extended_bounds: {},
            customLabel: '@timestamp',
          },
          schema: 'segment',
        },
        {
          id: '3',
          enabled: true,
          type: 'filters',
          params: {
            filters: [
              {
                input: {
                  query: 'events.total:*',
                  language: 'kuery',
                },
                label: 'events.total',
              },
            ],
          },
          schema: 'group',
        },
      ],
    },
  };
};

const getVisStateTCPSessions = (indexPatternId?: string) => {
  return {
    id: 'Wazuh-App-Statistics-remoted-tcp-sessions',
    title: 'TCP sessions',
    type: 'line',
    params: {
      type: 'line',
      grid: {
        categoryLines: true,
      },
      categoryAxes: [
        {
          id: 'CategoryAxis-1',
          type: 'category',
          position: 'bottom',
          show: true,
          style: {},
          scale: {
            type: 'linear',
          },
          labels: {
            show: true,
            filter: true,
            truncate: 100,
          },
          title: {},
        },
      ],
      valueAxes: [
        {
          id: 'ValueAxis-1',
          name: 'LeftAxis-1',
          type: 'value',
          position: 'left',
          show: true,
          style: {},
          scale: {
            type: 'linear',
            mode: 'normal',
          },
          labels: {
            show: true,
            rotate: 0,
            filter: false,
            truncate: 100,
          },
          title: {
            text: 'Count',
          },
        },
      ],
      seriesParams: [
        {
          show: true,
          type: 'line',
          mode: 'normal',
          data: {
            label: 'Count',
            id: '1',
          },
          valueAxis: 'ValueAxis-1',
          drawLinesBetweenPoints: true,
          lineWidth: 2,
          interpolate: 'linear',
          showCircles: true,
        },
      ],
      addTooltip: true,
      addLegend: true,
      legendPosition: 'right',
      times: [],
      addTimeMarker: false,
      labels: {},
      thresholdLine: {
        show: false,
        value: 10,
        width: 1,
        style: 'full',
        color: '#E7664C',
      },
    },
    uiState: {
      vis: {
        colors: {
          'tcp.sessions': '#70DBED', // prettier-ignore
        },
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
          type: 'sum',
          params: {
            field: 'tcp.sessions',
            customLabel: 'Count',
          },
          schema: 'metric',
        },
        {
          id: '2',
          enabled: true,
          type: 'date_histogram',
          params: {
            field: '@timestamp',
            timeRange: {
              from: 'now-24h',
              to: 'now',
            },
            useNormalizedOpenSearchInterval: true,
            scaleMetricValues: false,
            interval: 'auto',
            drop_partials: false,
            min_doc_count: 1,
            extended_bounds: {},
            customLabel: '@timestamp',
          },
          schema: 'segment',
        },
        {
          id: '3',
          enabled: true,
          type: 'filters',
          params: {
            filters: [
              {
                input: {
                  query: 'tcp.sessions:*',
                  language: 'kuery',
                },
                label: 'tcp.sessions',
              },
            ],
          },
          schema: 'group',
        },
      ],
    },
  };
};

/* Definitiion of panels */

export const getDashboardPanelsListenerEngine = (
  indexPatternId?: string,
): {
  [panelId: string]: DashboardPanelState<
    EmbeddableInput & { [k: string]: unknown }
  >;
} => {
  return {
    '1': {
      gridData: {
        w: 24,
        h: 13,
        x: 0,
        y: 0,
        i: '1',
      },
      type: 'visualization',
      explicitInput: {
        id: '1',
        savedVis: getVisStateTotalNumberOfBytesReceived(indexPatternId),
      },
    },
    '2': {
      gridData: {
        w: 24,
        h: 13,
        x: 24,
        y: 0,
        i: '2',
      },
      type: 'visualization',
      explicitInput: {
        id: '2',
        savedVis: getVisStateEventsSentToAnalysisd(indexPatternId),
      },
    },
    '3': {
      gridData: {
        w: 48,
        h: 13,
        x: 0,
        y: 13,
        i: '3',
      },
      type: 'visualization',
      explicitInput: {
        id: '3',
        savedVis: getVisStateTCPSessions(indexPatternId),
      },
    },
  };
};
