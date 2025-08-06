import { DashboardPanelState } from '../../../../../../../../../src/plugins/dashboard/public/application';
import { EmbeddableInput } from '../../../../../../../../../src/plugins/embeddable/public';
import { checkResultColors, decimalFormat } from './visualizationHelpers';

const getVisStateCheckResultPassed = (indexPatternId: string) => {
  return {
    id: 'check_result_passed',
    title: 'Checks passed',
    type: 'metric',
    uiState: {
      vis: {
        colors: checkResultColors(),
      },
    },
    params: {
      addTooltip: true,
      addLegend: false,
      type: 'metric',
      metric: {
        percentageMode: false,
        useRanges: true,
        colorSchema: 'Greens',
        metricColorMode: 'Labels',
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
        labels: { show: true },
        invertColors: false,
        style: {
          bgColor: false,
          labelColor: false,
          subText: '',
          fontSize: 40,
        },
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
          params: { customLabel: 'checks' },
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
                  query: 'check.result: "passed"',
                  language: 'kuery',
                },
                label: 'Passed',
              },
            ],
          },
          schema: 'group',
        },
      ],
    },
  };
};

const getVisStateCheckResultFailed = (indexPatternId: string) => {
  return {
    id: 'check_result_failed',
    title: 'Checks failed',
    type: 'metric',
    uiState: {
      vis: {
        colors: checkResultColors(),
      },
    },
    params: {
      addTooltip: true,
      addLegend: false,
      type: 'metric',
      metric: {
        percentageMode: false,
        useRanges: false,
        colorSchema: 'Reds',
        metricColorMode: 'Labels',
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
        labels: { show: true },
        invertColors: false,
        style: {
          bgFill: '#000',
          bgColor: false,
          labelColor: false,
          subText: '',
          fontSize: 40,
        },
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
          params: { customLabel: 'checks' },
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
                  query: 'check.result: "failed"',
                  language: 'kuery',
                },
                label: 'Failed',
              },
            ],
          },
          schema: 'group',
        },
      ],
    },
  };
};

const getVisStateCheckResultNotRun = (indexPatternId: string) => {
  return {
    id: 'check_result_not_run',
    title: 'Checks not Run',
    type: 'metric',
    uiState: {
      vis: {
        colors: checkResultColors(),
      },
    },
    params: {
      addTooltip: true,
      addLegend: false,
      type: 'metric',
      metric: {
        percentageMode: false,
        useRanges: false,
        colorSchema: 'Blues',
        metricColorMode: 'Labels',
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
        labels: { show: true },
        invertColors: false,
        style: {
          bgFill: '#000',
          bgColor: false,
          labelColor: false,
          subText: '',
          fontSize: 40,
        },
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
          params: { customLabel: 'checks' },
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
                  query: 'check.result: "Not run"',
                  language: 'kuery',
                },
                label: 'Not run',
              },
            ],
          },
          schema: 'group',
        },
      ],
    },
  };
};

// Here we are using vega visualization: https://vega.github.io/vega/
const checkScore = (indexPatternId: string) => ({
  $schema: 'https://vega.github.io/schema/vega/v5.json',
  data: [
    {
      name: 'scoredata',
      url: {
        '%context%': true,
        index: indexPatternId,
        body: {
          size: 0,
          aggs: {
            passed: {
              filter: {
                term: {
                  'check.result': 'passed',
                },
              },
            },
            failed: {
              filter: {
                term: {
                  'check.result': 'failed',
                },
              },
            },
          },
        },
      },
      format: {
        property: 'aggregations',
      },
      transform: [
        {
          type: 'formula',
          as: 'score',
          expr: '(datum.passed.doc_count + datum.failed.doc_count)? (datum.passed.doc_count / (datum.passed.doc_count + datum.failed.doc_count)) * 100 : 0',
        },
      ],
    },
  ],
  marks: [
    {
      type: 'text',
      from: { data: 'scoredata' },
      encode: {
        enter: {
          x: { signal: 'width / 2' },
          y: { signal: 'height / 1.5' },
          align: { value: 'center' },
          baseline: { value: 'bottom' },
          text: { signal: `format(datum.score, '${decimalFormat()}') + '%'` },
          fontSize: { value: 53.333 },
          fontWeight: { value: 700 },
          font: {
            value:
              '"Inter UI", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
          },
          fill: { value: checkResultColors().checkScoreColor },
        },
      },
    },
    {
      type: 'text',
      from: { data: 'scoredata' },
      encode: {
        enter: {
          x: { signal: 'width / 2' },
          y: { signal: 'height / 2 + 30' },
          align: { value: 'center' },
          baseline: { value: 'top' },
          text: { value: 'Score' },
          fontSize: { value: 16 },
          fill: { value: checkResultColors().checkScoreColor },
        },
      },
    },
  ],
});

export const getKPIsPanel = (
  indexPatternId: string,
): {
  [panelId: string]: DashboardPanelState<
    EmbeddableInput & { [k: string]: unknown }
  >;
} => {
  return {
    '1': {
      gridData: { w: 12, h: 6, x: 0, y: 0, i: '1' },
      type: 'visualization',
      explicitInput: {
        id: '1',
        savedVis: getVisStateCheckResultPassed(indexPatternId),
      },
    },
    '2': {
      gridData: { w: 12, h: 6, x: 12, y: 0, i: '2' },
      type: 'visualization',
      explicitInput: {
        id: '2',
        savedVis: getVisStateCheckResultFailed(indexPatternId),
      },
    },
    '3': {
      gridData: { w: 12, h: 6, x: 24, y: 0, i: '3' },
      type: 'visualization',
      explicitInput: {
        id: '3',
        savedVis: getVisStateCheckResultNotRun(indexPatternId),
      },
    },
    '4': {
      gridData: { w: 12, h: 6, x: 36, y: 0, i: '4' },
      type: 'visualization',
      explicitInput: {
        id: '4',
        savedVis: {
          id: '4',
          type: 'vega',
          params: {
            spec: JSON.stringify(checkScore(indexPatternId)),
          },
        },
      },
    },
  };
};
