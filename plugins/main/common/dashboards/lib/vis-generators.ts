// @ts-ignore
import { Filter } from 'src/plugins/data/common';
import { buildIndexPatternReferenceList, buildSearchSource } from './builders';
import { STYLE, type Style } from './constants';

export const getVisStateHorizontalBarByField = (
  indexPatternId: string,
  field: string,
  title: string,
  visIDPrefix: string,
  options: {
    excludeTerm?: string;
    addLegend?: boolean;
    orderAggregation?: 'asc' | 'desc';
    fieldCustomLabel?: string;
    size?: number;
    metricType?: string;
    metricField?: string;
    // Define the label, and if this exists, enable the other bucket
    otherBucket?: boolean | string;
    // Define the label, and if this exists, enable the missing bucket
    missingBucket?: boolean | string;
    filters?: Filter[];
  } = {},
) => {
  const {
    excludeTerm,
    addLegend = false,
    orderAggregation = 'desc',
    size = 10,
    fieldCustomLabel,
    metricType = 'count',
    metricField = undefined,
    otherBucket,
    missingBucket,
    filters: searchFilters = [],
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
        value: size,
        width: 1,
        style: 'full',
        color: '#E7664C',
      },
    },
    data: {
      searchSource: buildSearchSource(indexPatternId, {
        filter: searchFilters,
      }),
      references: buildIndexPatternReferenceList(indexPatternId),
      aggs: [
        {
          id: '1',
          enabled: true,
          type: metricType,
          params: metricField ? { field: metricField } : {},
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
            otherBucket: Boolean(otherBucket),
            otherBucketLabel:
              otherBucket && typeof otherBucket === 'boolean'
                ? 'Other'
                : otherBucket,
            missingBucket: Boolean(missingBucket),
            missingBucketLabel:
              missingBucket && typeof missingBucket === 'boolean'
                ? 'Missing'
                : missingBucket,
            customLabel: fieldCustomLabel,
            ...(excludeTerm ? { json: `{"exclude":"${excludeTerm}"}` } : {}),
          },
          schema: 'segment',
        },
      ],
    },
  };
};

export const getVisStateHorizontalBarSplitSeries = (
  indexPatternId: string,
  field: string,
  title: string,
  visIDPrefix: string,
  options: {
    orderAggregation?: 'asc' | 'desc';
    fieldSize?: number;
    size?: number;
    fieldCustomLabel?: string;
    metricCustomLabel?: string;
    metricType?: string;
    metricField?: string;
    valueAxesTitleText?: string;
    categoryAxesShow?: boolean;
    seriesLabel?: string;
    seriesMode?: 'stacked' | 'normal';
    otherBucket?: boolean | string;
    missingBucket?: boolean | string;
    // Define the filter
    searchFilter?: Filter[];
    uiState?: {
      vis: {
        colors: {
          [key: string]: string;
        };
      };
    };
  } = {
    uiState: {
      vis: {
        colors: {},
      },
    },
  },
) => {
  const {
    orderAggregation = 'desc',
    fieldSize = 10,
    size = 10,
    fieldCustomLabel,
    metricCustomLabel,
    metricType = 'count',
    metricField = undefined,
    valueAxesTitleText = '',
    categoryAxesShow = false,
    seriesLabel = '',
    seriesMode = 'stacked',
    otherBucket,
    missingBucket,
    searchFilter,
    uiState,
  } = options;
  return {
    id: `${visIDPrefix}-${field}`,
    title: title,
    type: 'horizontal_bar',
    uiState,
    params: {
      addLegend: true,
      addTimeMarker: false,
      addTooltip: true,
      categoryAxes: [
        {
          id: 'CategoryAxis-1',
          labels: {
            filter: false,
            rotate: 0,
            show: false,
            truncate: 30,
          },
          position: 'left',
          scale: {
            type: 'linear',
          },
          show: categoryAxesShow,
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
            label: seriesLabel,
          },
          drawLinesBetweenPoints: true,
          lineWidth: 2,
          mode: seriesMode,
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
        value: size,
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
            defaultYExtents: false,
          },
          show: true,
          style: {},
          title: {
            text: valueAxesTitleText,
          },
          type: 'value',
        },
      ],
    },
    data: {
      searchSource: buildSearchSource(indexPatternId, {
        filter: searchFilter,
      }),
      references: buildIndexPatternReferenceList(indexPatternId),
      aggs: [
        {
          id: '1',
          enabled: true,
          type: metricType,
          params: {
            customLabel: metricCustomLabel,
            field: metricField,
          },
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
            size: fieldSize,
            otherBucket: Boolean(otherBucket),
            otherBucketLabel:
              otherBucket && typeof otherBucket === 'boolean'
                ? 'Other'
                : otherBucket,
            missingBucket: Boolean(missingBucket),
            missingBucketLabel:
              missingBucket && typeof missingBucket === 'boolean'
                ? 'Missing'
                : missingBucket,
            customLabel: fieldCustomLabel,
          },
          schema: 'group',
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
    order?: 'asc' | 'desc';
    size?: number;
    perPage?: number;
    fieldCustomLabel?: string;
    metricCustomLabel?: string;
    addLegend?: boolean;
    // Define the label, and if this exists, enable the other bucket
    otherBucket?: boolean | string;
    // Define the label, and if this exists, enable the missing bucket
    missingBucket?: boolean | string;
    filters?: any[];
  } = {},
) => {
  const {
    order = 'desc',
    excludeTerm,
    size = 5,
    perPage = 5,
    fieldCustomLabel: customLabel,
    otherBucket = false,
    missingBucket = false,
    metricCustomLabel = 'Count',
    filters = [],
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
      searchSource: buildSearchSource(indexPatternId, { filter: filters }),
      references: buildIndexPatternReferenceList(indexPatternId),
      aggs: [
        {
          id: '1',
          enabled: true,
          type: 'count',
          params: {
            customLabel: metricCustomLabel,
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
            order,
            size,
            otherBucket: Boolean(otherBucket),
            otherBucketLabel:
              otherBucket && typeof otherBucket === 'boolean'
                ? 'Other'
                : otherBucket,
            missingBucket: Boolean(missingBucket),
            missingBucketLabel:
              missingBucket && typeof missingBucket === 'boolean'
                ? 'Missing'
                : missingBucket,
            customLabel,
            ...(excludeTerm ? { json: `{"exclude":"${excludeTerm}"}` } : {}),
          },
          schema: 'bucket',
        },
      ],
    },
  };
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
      searchSource: buildSearchSource(indexPatternId),
      references: buildIndexPatternReferenceList(indexPatternId),
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
      searchSource: buildSearchSource(indexPatternId),
      references: buildIndexPatternReferenceList(indexPatternId),
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

export interface MetricVisOptions {
  id: string;
  title: string;
  colorSchema?: string;
  useRanges?: boolean;
  style?: Style;
  aggsQuery?: { input: { query: string; language: string }; label: string }[];
  metricAgg?: { type: string; params?: any };
  colors: Record<string, string>;
}

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
      searchSource: buildSearchSource(indexPatternId),
      references: buildIndexPatternReferenceList(indexPatternId),
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
 * @returns {Record<string, any>} A mapping of panel IDs to dashboard panel states.
 *
 * @example
 * const dashboardTables = createDashboardTables('my-index', [
 *   { panelId: 't1', x: 0, field: 'wazuh.agent.name', title: 'Top 5 agents', visIDPrefix: 'it-hygiene-stat', fieldCustomLabel: 'Top 5 agents' },
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
            fieldCustomLabel ? { fieldCustomLabel } : {},
          ),
        },
      };
      return acc;
    },
    {} as Record<string, any>,
  );
};
