import { DashboardPanelState } from '../../../../../../../../src/plugins/dashboard/public/application';
import { EmbeddableInput } from '../../../../../../../../src/plugins/embeddable/public';

const indexPatternRefs = (indexPatternId?: string) => [
  {
    name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
    type: 'index-pattern' as const,
    id: indexPatternId,
  },
  {
    name: 'kibanaSavedObjectMeta.searchSourceJSON.filter[0].meta.index',
    type: 'index-pattern' as const,
    id: indexPatternId,
  },
  {
    name: 'kibanaSavedObjectMeta.searchSourceJSON.filter[1].meta.index',
    type: 'index-pattern' as const,
    id: indexPatternId,
  },
];

const metricNamePhraseFilter = (
  indexPatternId: string | undefined,
  metricName: string,
) => ({
  $state: { store: 'appState' },
  meta: {
    alias: null,
    disabled: false,
    index: indexPatternId,
    key: 'metric.name',
    negate: false,
    params: {
      query: metricName,
      type: 'phrase',
    },
    type: 'phrase',
  },
  query: {
    match_phrase: {
      'metric.name': metricName,
    },
  },
});

const excludeSpaceNameExistsFilter = (indexPatternId: string | undefined) => ({
  $state: { store: 'appState' },
  meta: {
    alias: null,
    disabled: false,
    index: indexPatternId,
    key: 'wazuh.space.name',
    negate: true,
    type: 'exists',
    value: 'exists',
    params: {
      query: null,
      type: 'phrase',
    },
  },
  exists: {
    field: 'wazuh.space.name',
  },
});

const lineChartParamsBase = (yAxisText: string) => ({
  type: 'line',
  grid: {
    categoryLines: false,
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
        text: yAxisText,
      },
    },
  ],
  seriesParams: [
    {
      show: true,
      type: 'line',
      mode: 'normal',
      data: {
        label: yAxisText,
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
});

const getEngineHealthLineVis = (
  visId: string,
  title: string,
  yAxisText: string,
  metricName: string,
  dateHistogramInterval: 'h' | 'auto',
  indexPatternId?: string,
) => ({
  id: visId,
  title,
  type: 'line',
  params: lineChartParamsBase(yAxisText),
  uiState: {},
  data: {
    searchSource: {
      query: {
        language: 'kuery',
        query: '',
      },
      filter: [
        metricNamePhraseFilter(indexPatternId, metricName),
        excludeSpaceNameExistsFilter(indexPatternId),
      ],
      index: indexPatternId,
    },
    references: indexPatternRefs(indexPatternId),
    aggs: [
      {
        id: '1',
        enabled: true,
        type: 'max',
        params: {
          field: 'metric.value',
          customLabel: yAxisText,
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
            from: 'now-30d',
            to: 'now',
          },
          useNormalizedOpenSearchInterval: true,
          scaleMetricValues: false,
          interval: dateHistogramInterval,
          drop_partials: false,
          min_doc_count: 1,
          extended_bounds: {},
        },
        schema: 'segment',
      },
    ],
  },
});

export const getDashboardPanelsEngineHealth = (
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
        h: 15,
        x: 0,
        y: 0,
        i: '1',
      },
      type: 'visualization',
      explicitInput: {
        id: '1',
        savedVis: getEngineHealthLineVis(
          'wz-vis-statistics-engine-health-server-bytes-received',
          'Bytes received',
          'Bytes received',
          'server.bytes.received',
          'h',
          indexPatternId,
        ),
      },
    },
    '2': {
      gridData: {
        w: 24,
        h: 15,
        x: 0,
        y: 15,
        i: '2',
      },
      type: 'visualization',
      explicitInput: {
        id: '2',
        savedVis: getEngineHealthLineVis(
          'wz-vis-statistics-engine-health-router-events-processed',
          'Events processed',
          'Events processed',
          'router.events.processed',
          'auto',
          indexPatternId,
        ),
      },
    },
    '3': {
      gridData: {
        w: 24,
        h: 15,
        x: 24,
        y: 0,
        i: '3',
      },
      type: 'visualization',
      explicitInput: {
        id: '3',
        savedVis: getEngineHealthLineVis(
          'wz-vis-statistics-engine-health-server-events-received',
          'Events received',
          'Events received',
          'server.events.received',
          'auto',
          indexPatternId,
        ),
      },
    },
    '4': {
      gridData: {
        w: 24,
        h: 15,
        x: 24,
        y: 15,
        i: '4',
      },
      type: 'visualization',
      explicitInput: {
        id: '4',
        savedVis: getEngineHealthLineVis(
          'wz-vis-statistics-engine-health-router-events-dropped',
          'Events dropped',
          'Events dropped',
          'router.events.dropped',
          'auto',
          indexPatternId,
        ),
      },
    },
  };
};
