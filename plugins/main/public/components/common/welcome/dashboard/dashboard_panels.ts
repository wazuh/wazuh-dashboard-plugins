import { DashboardPanelState } from '../../../../../../../src/plugins/dashboard/public/application';
import { EmbeddableInput } from '../../../../../../../src/plugins/embeddable/public';

const getVisStateEventsCountEvolution = (indexPatternId: string) => ({
  id: 'App-Agents-Welcome-Events-Evolution',
  title: 'Events count evolution',
  type: 'line',
  params: {
    type: 'line',
    grid: { categoryLines: false },
    categoryAxes: [
      {
        id: 'CategoryAxis-1',
        type: 'category',
        position: 'bottom',
        show: true,
        style: {},
        scale: { type: 'linear' },
        labels: { show: true, filter: true, truncate: 100 },
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
        scale: { type: 'linear', mode: 'normal' },
        labels: { show: true, rotate: 0, filter: false, truncate: 100 },
        title: { text: 'Count' },
      },
    ],
    seriesParams: [
      {
        show: true,
        type: 'line',
        mode: 'normal',
        data: { label: 'Count', id: '1' },
        valueAxis: 'ValueAxis-1',
        drawLinesBetweenPoints: true,
        lineWidth: 2,
        interpolate: 'linear',
        showCircles: true,
      },
    ],
    addTooltip: true,
    addLegend: false,
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
    dimensions: {
      x: null,
      y: [
        {
          accessor: 0,
          format: { id: 'number' },
          params: {},
          label: 'Count',
          aggType: 'count',
        },
      ],
    },
  },
  uiState: {
    vis: { params: { sort: { columnIndex: 2, direction: 'desc' } } },
  },
  data: {
    searchSource: {
      query: {
        language: 'kuery',
        query: '',
      },
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
      { id: '1', enabled: true, type: 'count', schema: 'metric', params: {} },
      {
        id: '2',
        enabled: true,
        type: 'date_histogram',
        schema: 'segment',
        params: {
          field: 'timestamp',
          useNormalizedEsInterval: true,
          scaleMetricValues: false,
          interval: 'auto',
          drop_partials: false,
          min_doc_count: 1,
          extended_bounds: {},
        },
      },
    ],
  },
});

export const getDashboardPanels = (
  indexPatternId: string,
): {
  [panelId: string]: DashboardPanelState<
    EmbeddableInput & { [k: string]: unknown }
  >;
} => {
  return {
    '1': {
      gridData: {
        w: 48,
        h: 12,
        x: 0,
        y: 0,
        i: '1',
      },
      type: 'visualization',
      explicitInput: {
        id: '1',
        savedVis: getVisStateEventsCountEvolution(indexPatternId),
      },
    },
  };
};
