import { DashboardPanelState } from 'src/plugins/dashboard/public/application';
import { STYLE } from './constants';
import {
  createIndexPatternReferences,
  createSearchSource,
} from './create-saved-vis-data';
import { EmbeddableInput } from 'src/plugins/embeddable/public';

export const getVisStatePieByField = (
  indexPatternId: string,
  field: string,
  title: string,
  visIDPrefix: string,
  orderAggregation: 'asc' | 'desc' = 'desc',
) => {
  return {
    id: `${visIDPrefix}-${field}`,
    title: title,
    type: 'pie',
    params: {
      type: 'pie',
      addTooltip: true,
      addLegend: false,
      legendPosition: 'right',
      isDonut: false,
      labels: {
        show: true,
        values: true,
        last_level: true,
        truncate: 100,
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
          params: {},
          schema: 'metric',
        },
        {
          id: '2',
          enabled: true,
          type: 'terms',
          params: {
            field: field,
            orderBy: '1',
            order: orderAggregation,
            size: 10,
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

export const getVisStateDonutByField = (
  indexPatternId: string,
  field: string,
  title: string,
  visIDPrefix: string,
  orderAggregation: 'asc' | 'desc' = 'desc',
  options: {
    filter?: any[];
  },
) => {
  const { filter = [] } = options;
  return {
    id: `${visIDPrefix}-${field}`,
    title: title,
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
      searchSource: createSearchSource(indexPatternId, { filter }),
      references: createIndexPatternReferences(indexPatternId),
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
            field: field,
            orderBy: '1',
            order: orderAggregation,
            size: 10,
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

export const getVisStateHorizontalBarByField = (
  indexPatternId: string,
  field: string,
  title: string,
  visIDPrefix: string,
  options: {
    excludeTerm?: string;
    addLegend?: boolean;
    orderAggregation?: 'asc' | 'desc';
    customLabel?: string;
    filter?: any[];
  } = {},
) => {
  const {
    excludeTerm,
    addLegend = false,
    orderAggregation = 'desc',
    customLabel,
    filter: searchFilter = [],
  } = options;
  return {
    id: `${visIDPrefix}-${field}`,
    title: title,
    type: 'horizontal_bar',
    params: {
      type: 'histogram',
      grid: {
        categoryLines: false,
      },
      categoryAxes: [
        {
          id: 'CategoryAxis-1',
          type: 'category',
          position: 'left',
          show: true,
          style: {},
          scale: {
            type: 'linear',
          },
          labels: {
            show: true,
            rotate: 0,
            filter: false,
            truncate: 200,
          },
          title: {},
        },
      ],
      valueAxes: [
        {
          id: 'ValueAxis-1',
          name: 'LeftAxis-1',
          type: 'value',
          position: 'bottom',
          show: true,
          style: {},
          scale: {
            type: 'linear',
            mode: 'normal',
          },
          labels: {
            show: true,
            rotate: 75,
            filter: true,
            truncate: 100,
          },
          title: {
            text: '',
          },
        },
      ],
      seriesParams: [
        {
          show: true,
          type: 'histogram',
          mode: 'normal',
          data: {
            label: 'Count',
            id: '1',
          },
          valueAxis: 'ValueAxis-1',
          drawLinesBetweenPoints: true,
          lineWidth: 2,
          showCircles: true,
        },
      ],
      addTooltip: true,
      addLegend,
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
    data: {
      searchSource: createSearchSource(indexPatternId, {
        filter: searchFilter,
      }),
      references: createIndexPatternReferences(indexPatternId),
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
            field: field,
            orderBy: '1',
            order: orderAggregation,
            size: 5,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel,
            ...(excludeTerm ? { json: `{"exclude":"${excludeTerm}"}` } : {}),
          },
          schema: 'segment',
        },
      ],
    },
  };
};

export const getVisStateHorizontalBarByFieldWithDynamicColors = (
  indexPatternId: string,
  field: string,
  title: string,
  visIDPrefix: string,
  fieldCustomLabel: string,
  addLegend: boolean = true,
  orderAggregation: 'asc' | 'desc' = 'desc',
) => {
  const visState = getVisStateHorizontalBarByField(
    indexPatternId,
    field,
    title,
    visIDPrefix,
    { customLabel: fieldCustomLabel, addLegend, orderAggregation },
  );

  return visState;
};

export const getVisStateMetricUniqueCountByField = (
  indexPatternId: string,
  field: string,
  title: string,
  visIDPrefix: string,
  aggLabel: string = '',
) => {
  return {
    id: `${visIDPrefix}-${field}`,
    title: title,
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
            field: field,
            customLabel: aggLabel,
          },
          schema: 'metric',
        },
      ],
    },
  };
};

export const getVisStateHistogramBy = (
  indexPatternId: string,
  field: string,
  title: string,
  visIDPrefix: string,
  interval: string = 'd',
  options: {
    addLegend?: boolean;
    customLabel?: string;
    valueAxesTitleText?: string;
  },
) => {
  const {
    addLegend = true,
    customLabel = '',
    valueAxesTitleText = 'Count',
  } = options;
  return {
    id: `${visIDPrefix}-${field}`,
    title: title,
    type: 'area',
    params: {
      type: 'area',
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
            text: valueAxesTitleText,
          },
        },
      ],
      seriesParams: [
        {
          show: true,
          type: 'area',
          mode: 'stacked',
          data: {
            label: 'Count',
            id: '1',
          },
          drawLinesBetweenPoints: true,
          lineWidth: 2,
          showCircles: true,
          interpolate: 'linear',
          valueAxis: 'ValueAxis-1',
        },
      ],
      addTooltip: true,
      addLegend,
      legendPosition: 'right',
      times: [],
      addTimeMarker: false,
      thresholdLine: {
        show: false,
        value: 10,
        width: 1,
        style: 'full',
        color: '#E7664C',
      },
      labels: {},
    },
    data: {
      searchSource: createSearchSource(indexPatternId),
      references: createIndexPatternReferences(indexPatternId),
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
          type: 'date_histogram',
          params: {
            customLabel,
            field: field,
            timeRange: {
              from: 'now-24h',
              to: 'now',
            },
            useNormalizedOpenSearchInterval: true,
            scaleMetricValues: false,
            interval: interval,
            drop_partials: false,
            min_doc_count: 1,
            extended_bounds: {},
          },
          schema: 'segment',
        },
      ],
    },
  };
};

export const getVisStateTable = (
  indexPatternId: string,
  field: string,
  title: string,
  visIDPrefix: string,
  options: {
    excludeTerm?: string;
    size?: number;
    perPage?: number;
    customLabel?: string;
    filter?: any[];
  } = {},
) => {
  const {
    excludeTerm,
    size = 5,
    perPage = 5,
    customLabel,
    filter = [],
  } = options;

  return {
    id: `${visIDPrefix}-${field}`,
    title,
    type: 'table',
    params: {
      perPage: perPage,
      percentageCol: '',
      row: true,
      showMetricsAtAllLevels: false,
      showPartialRows: false,
      showTotal: false,
      totalFunc: 'sum',
    },
    uiState: {
      vis: {
        columnsWidth: [
          {
            colIndex: 1,
            width: 75,
          },
        ],
      },
    },
    data: {
      searchSource: createSearchSource(indexPatternId, { filter }),
      references: createIndexPatternReferences(indexPatternId),
      aggs: [
        {
          id: '1',
          enabled: true,
          type: 'count',
          params: {
            customLabel: 'Count',
          },
          schema: 'metric',
        },
        {
          id: '2',
          enabled: true,
          type: 'terms',
          params: {
            field,
            orderBy: '1',
            order: 'desc',
            size,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel,
            ...(excludeTerm ? { json: `{"exclude":"${excludeTerm}"}` } : {}),
          },
          schema: 'bucket',
        },
      ],
    },
  };
};

export interface MetricVisOptions {
  id: string;
  title: string;
  colorSchema?: string;
  useRanges?: boolean;
  style?: typeof STYLE;
  aggsQuery?: { input: { query: string; language: string }; label: string }[];
  metricAgg?: { type: string; params?: any };
  colors: Record<string, string>;
}

/**
 * Generates a visualization state object for a "metric" type chart.
 * @doc
 * https://eui.elastic.co/v106.0.0/docs/dataviz/types/metric-chart/
 */
export const getVisStateMetric = (
  indexPatternId: string,
  options: MetricVisOptions,
) => {
  const {
    id,
    title,
    colorSchema = 'Green to Red',
    useRanges = false,
    style = STYLE,
    aggsQuery = [],
    metricAgg = { type: 'count', params: { customLabel: 'checks' } },
    colors = {},
  } = options;

  return {
    id,
    title,
    type: 'metric',
    uiState: {
      vis: {
        colors,
      },
    },
    params: {
      addLegend: false,
      addTooltip: true,
      type: 'metric',
      metric: {
        colorSchema,
        colorsRange: [
          {
            from: -1,
            to: 0,
          },
          {
            from: 1,
            to: 200000000,
          },
        ],
        invertColors: false,
        labels: { show: true },
        metricColorMode: 'Labels',
        percentageMode: false,
        style,
        useRanges,
      },
    },
    data: {
      searchSource: createSearchSource(indexPatternId),
      references: createIndexPatternReferences(indexPatternId),
      aggs: [
        {
          id: '1',
          enabled: true,
          ...metricAgg,
          schema: 'metric',
        },
        ...(aggsQuery.length
          ? [
              {
                id: '2',
                enabled: true,
                type: 'filters',
                params: { filters: aggsQuery },
                schema: 'group',
              },
            ]
          : []),
      ],
    },
  };
};

/**
 * Table panel configuration for the dashboard table generator.
 */
export interface TablePanelConfig {
  /** Unique panel ID (e.g., 't1') */
  panelId: string;
  /** X coordinate in the dashboard grid layout */
  x: number;
  /** Field name to aggregate on */
  field: string;
  /** Visualization title */
  title: string;
  /** Visualization ID prefix */
  visIDPrefix: string;
  /** Optional custom field label */
  fieldCustomLabel?: string;
}

/**
 * Creates a visualization state object for a "data table" chart.
 * It is used on sca dashboard
 *
 * @param {string} indexPatternId - The ID of the OpenSearch index pattern.
 * @param {TablePanelConfig[]} panels - Array of table panel definitions.
 * @returns {Record<string, DashboardPanelState<EmbeddableInput>>} A mapping of panel IDs to dashboard panel states.
 *
 * @example
 * const dashboardTables = createDashboardTables('my-index', [
 *   { panelId: 't1', x: 0, field: 'agent.name', title: 'Top 5 agents', visIDPrefix: 'it-hygiene-stat', fieldCustomLabel: 'Top 5 agents' },
 *   { panelId: 't2', x: 12, field: 'policy.name', title: 'Top 5 policies', visIDPrefix: 'sca-top-policies', fieldCustomLabel: 'Top 5 policies' },
 * ]);
 */
export const getVisStateDashboardTables = (
  indexPatternId: string,
  panels: TablePanelConfig[],
) => {
  return panels.reduce(
    (acc, { panelId, x, field, title, visIDPrefix, fieldCustomLabel }) => {
      acc[panelId] = {
        gridData: { w: 12, h: 12, x, y: 0, i: panelId },
        type: 'visualization',
        explicitInput: {
          id: panelId,
          savedVis: getVisStateTable(
            indexPatternId,
            field,
            title,
            visIDPrefix,
            fieldCustomLabel ? { customLabel: fieldCustomLabel } : {},
          ),
        },
      };
      return acc;
    },
    {} as Record<string, DashboardPanelState<EmbeddableInput>>,
  );
};
