import { STYLE } from '../../../components/overview/it-hygiene/common/saved-vis/constants';
import {
  createIndexPatternReferences,
  createSearchSource,
} from '../lib/create-saved-vis-data';

export const getVisStatePieByField = (
  indexPatternId: string,
  field: string,
  title: string,
  visIDPrefix: string,
  options: {
    orderAggregation?: 'asc' | 'desc';
    size?: number;
    // Define the label, and if this exists, enable the other bucket
    otherBucket?: boolean | string;
    // Define the label, and if this exists, enable the missing bucket
    missingBucket?: boolean | string;
  } = {},
) => {
  const {
    orderAggregation = 'desc',
    size = 10,
    otherBucket,
    missingBucket,
  } = options;
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
            size: size,
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
  options: {
    orderAggregation?: 'asc' | 'desc';
    size?: number;
    // Define the label, and if this exists, enable the other bucket
    otherBucket?: boolean | string;
    // Define the label, and if this exists, enable the missing bucket
    missingBucket?: boolean | string;
  } = {},
) => {
  const {
    orderAggregation = 'desc',
    size = 10,
    otherBucket,
    missingBucket,
  } = options;
  return {
    id: `${visIDPrefix}-${field}`,
    title: title,
    type: 'pie',
    params: {
      type: 'pie',
      addTooltip: true,
      addLegend: false,
      legendPosition: 'right',
      isDonut: true,
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
            size: size,
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
    orderAggregation?: 'asc' | 'desc';
    size?: number;
    fieldCustomLabel?: string;
    addLegend?: boolean;
    // Define the label, and if this exists, enable the other bucket
    otherBucket?: boolean | string;
    // Define the label, and if this exists, enable the missing bucket
    missingBucket?: boolean | string;
  } = {},
) => {
  const {
    orderAggregation = 'desc',
    size = 10,
    fieldCustomLabel,
    addLegend = false,
    otherBucket,
    missingBucket,
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
    valueAxesTitleText?: string;
    seriesLabel?: string;
    // Define the label, and if this exists, enable the other bucket
    otherBucket?: boolean | string;
    // Define the label, and if this exists, enable the missing bucket
    missingBucket?: boolean | string;
  } = {},
) => {
  const {
    orderAggregation = 'desc',
    fieldSize = 10,
    size = 10,
    fieldCustomLabel,
    metricCustomLabel,
    valueAxesTitleText = '',
    seriesLabel = '',
    otherBucket,
    missingBucket,
  } = options;
  return {
    id: `${visIDPrefix}-${field}`,
    title: title,
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
            rotate: 0,
            show: false,
            truncate: 30,
          },
          position: 'left',
          scale: {
            type: 'linear',
          },
          show: false,
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
      searchSource: createSearchSource(indexPatternId),
      references: createIndexPatternReferences(indexPatternId),
      aggs: [
        {
          id: '1',
          enabled: true,
          type: 'count',
          params: {
            customLabel: metricCustomLabel, //'File owner count',
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

export const getVisStateTableByField = (
  indexPatternId: string,
  field: string,
  title: string,
  visIDPrefix: string,
  options: {
    orderAggregation?: 'asc' | 'desc';
    size?: number;
    fieldCustomLabel?: string;
    addLegend?: boolean;
    // Define the label, and if this exists, enable the other bucket
    otherBucket?: boolean | string;
    // Define the label, and if this exists, enable the missing bucket
    missingBucket?: boolean | string;
    itemsPerPage?: number;
  } = {},
) => {
  const {
    orderAggregation = 'desc',
    size = 10,
    fieldCustomLabel,
    otherBucket,
    missingBucket,
    itemsPerPage = 5,
  } = options;
  return {
    id: `${visIDPrefix}-${field}`,
    title,
    type: 'table',
    params: {
      perPage: itemsPerPage,
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
      searchSource: createSearchSource(indexPatternId),
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
            field: field,
            orderBy: '1',
            order: orderAggregation,
            size: size,
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
          schema: 'bucket',
        },
      ],
    },
  };
};
