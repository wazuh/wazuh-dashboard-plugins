import { STYLE } from './constants';
import {
  createIndexPatternReferences,
  createSearchSource,
} from './create-saved-vis-data';

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
  } = {},
) => {
  const {
    excludeTerm,
    addLegend = false,
    orderAggregation = 'desc',
    customLabel,
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

export const getVisStateMetricFilterBy = (
  indexPatternId: string,
  filterField: string,
  title: string,
  visIDPrefix: string,
  filterValue: string = '',
  label: string = '',
) => {
  return {
    id: `${visIDPrefix}-${filterField}`,
    title: title,
    type: 'metric',
    params: {
      addLegend: false,
      addTooltip: true,
      metric: {
        colorSchema: 'Green to Red',
        colorsRange: [
          {
            from: 0,
            to: 10000,
          },
        ],
        invertColors: false,
        labels: {
          show: true,
        },
        metricColorMode: 'None',
        percentageMode: false,
        style: STYLE,
        useRanges: false,
      },
      type: 'metric',
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
            customLabel: label,
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
                  query: filterValue,
                  language: 'kuery',
                },
                label: label,
              },
            ],
          },
          schema: 'group',
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
