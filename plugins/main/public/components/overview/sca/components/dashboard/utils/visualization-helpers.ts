import { SCA_CHECK_RESULT_COLOR_MAPPING } from "../../../../../../../common/dashboards/lib";
import { getCore } from '../../../../../../kibana-services';

const core = getCore();

function convertNumeralToD3Format(numeralFormat: string): string {
  const useThousands: boolean = numeralFormat.includes(',');
  const decimalMatch: RegExpMatchArray | null =
    numeralFormat.match(/\.(0+)?(\[0+\])?/);

  let minDecimals: number = 0;
  let maxDecimals: number = 0;
  let useTrim: boolean = false;

  if (decimalMatch) {
    const fixed: string = decimalMatch[1] || '';
    const optional: string = decimalMatch[2] || '';
    minDecimals = fixed.length;
    maxDecimals = fixed.length + (optional.match(/0/g) || []).length;
    useTrim = optional.length > 0;
  }

  const precision: number = maxDecimals || minDecimals;

  let format: string = '';
  if (useThousands) format += ',';
  format += '.' + precision;

  format += '~f';

  return format;
}

export const decimalFormat = () => {
  let decimalFormat;
  const pattern = core.uiSettings.get('format:percent:defaultPattern');
  decimalFormat = convertNumeralToD3Format(pattern);

  return decimalFormat ?? '.2f';
};

export const checkResultColors = () => {
  const colors = {
    ...SCA_CHECK_RESULT_COLOR_MAPPING,
    checkScoreColor: core.uiSettings.get('theme:darkMode')
      ? '#dfe5ef'
      : '#333333',
  };

  return colors;
};

export const createBaseVisState = (
  id: string,
  title: string,
  type: string,
  params: any,
  aggs: any[],
  indexPatternId: string,
) => ({
  id,
  title,
  type,
  params,
  uiState: {
    vis: {
      colors: checkResultColors(),
    },
  },
  data: {
    searchSource: {
      query: { language: 'kuery', query: '' },
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
        params: { customLabel: ' ' },
        schema: 'metric',
      },
      ...aggs,
    ],
  },
});

export const createHorizontalBarVis = (
  id: string,
  title: string,
  field: string,
  fieldLabel: string,
  indexPatternId: string,
) =>
  createBaseVisState(
    id,
    title,
    'horizontal_bar',
    {
      addLegend: true,
      addTimeMarker: false,
      addTooltip: true,
      categoryAxes: [
        {
          id: 'CategoryAxis-1',
          labels: { filter: false, rotate: 0, show: true, truncate: 200 },
          position: 'left',
          scale: { type: 'linear' },
          show: true,
          style: {},
          title: {},
          type: 'category',
        },
      ],
      grid: { categoryLines: false },
      labels: {},
      legendPosition: 'right',
      row: true,
      seriesParams: [
        {
          data: { id: '1', label: ' ' },
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
          labels: { filter: true, rotate: 75, show: true, truncate: 100 },
          name: 'LeftAxis-1',
          position: 'bottom',
          scale: { mode: 'normal', type: 'linear' },
          show: true,
          style: {},
          title: { text: ' ' },
          type: 'value',
        },
      ],
    },
    [
      {
        id: '2',
        enabled: true,
        type: 'terms',
        params: {
          field,
          orderBy: '1',
          order: 'desc',
          size: 5,
          otherBucket: false,
          otherBucketLabel: 'Other',
          missingBucket: false,
          missingBucketLabel: 'Missing',
          customLabel: fieldLabel,
        },
        schema: 'segment',
      },
      {
        id: '3',
        enabled: true,
        type: 'terms',
        params: {
          field: 'check.result',
          orderBy: 'custom',
          orderAgg: {
            id: '3-orderAgg',
            enabled: true,
            type: 'count',
            params: {},
            schema: 'orderAgg',
          },
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
    indexPatternId,
  );
