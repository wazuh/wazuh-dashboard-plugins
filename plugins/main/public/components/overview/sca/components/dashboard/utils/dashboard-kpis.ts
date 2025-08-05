import { DashboardPanelState } from '../../../../../../../../../src/plugins/dashboard/public/application';
import { EmbeddableInput } from '../../../../../../../../../src/plugins/embeddable/public';
import {
  createIndexPatternReferences,
  createSearchSource,
} from '../../../../it-hygiene/common/saved-vis/create-saved-vis-data';

const checkResultColors = {
  passed: '#209280',
  failed: '#cc5642',
  'Not run': '#6092c0',
};

const checkScoreColor = "#DD0A73"

const getVisStateGlobalPacketLossMetric = (
  indexPatternId: string,
): SavedVis => {
  return {
    id: 'it-hygiene-network-interfaces-global-packet-loss-rate',
    title: 'Average packet loss rate',
    type: 'metric',
    params: {
      addTooltip: true,
      addLegend: false,
      type: 'metric',
      metric: {
        percentageMode: true,
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
        // style: STYLE,
      },
    },
    data: {
      searchSource: createSearchSource(indexPatternId),
      references: createIndexPatternReferences(indexPatternId),
      aggs: [
        {
          id: 'score-checks',
          enabled: true,
          type: 'avg',
          schema: 'metric',
          // params: {
          //   field: 'check.result',
          //   json: JSON.stringify({
          //     script: {
          //       source: `
          //       return 42;
          //     `,
          //       lang: 'painless',
          //     },
          //   }),
          //   customLabel: 'Checks Score (%)',
          // },
        }
      ],
    },
  };
};

const getVisStateCheckResultPassed = (indexPatternId: string) => {
  return {
    id: 'check_result_passed',
    title: 'Checks passed',
    type: 'metric',
    uiState: {
      vis: {
        colors: checkResultColors,
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
        colors: checkResultColors,
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
        colors: checkResultColors,
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

const getVisStateTotalChecks = (indexPatternId: string) => {
  return {
    id: 'total_checks_metric',
    title: 'Total Checks',
    type: 'metric',
    uiState: {
      vis: {
        colors: checkResultColors,
      },
    },
    params: {
      addTooltip: true,
      addLegend: false,
      type: 'metric',
      metric: {
        percentageMode: false,
        useRanges: false,
        colorSchema: 'Greys',
        metricColorMode: 'None',
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
        labels: {
          show: true,
        },
        style: {
          fontSize: 48,
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
          schema: 'metric',
          params: { customLabel: 'Total Checks' },
        },
      ],
    },
  };
};

const checkScore = {
  "$schema": "https://vega.github.io/schema/vega/v5.json",
  "data": [
    {
      "name": "scoredata",
      "url": {
        "%context%": true,
        "index": "wazuh-states-sca-*",
        "body": {
          "size": 0,
          "aggs": {
            "passed": {
              "filter": {
                "term": {
                  "check.result": "passed"
                }
              }
            },
            "total": {
              "value_count": {
                "field": "check.result"
              }
            }
          }
        }
      },
      "format": {
        "property": "aggregations"
      },
      "transform": [
        {
          "type": "formula",
          "as": "score",
          "expr": "(datum.passed.doc_count / datum.total.value) * 100"
        }
      ]
    }
  ],
  "marks": [
    {
      "type": "text",
      "from": { "data": "scoredata" },
      "encode": {
        "enter": {
          "x": { "signal": "width / 2" },
          "y": { "signal": "height / 1.5" },
          "align": { "value": "center" },
          "baseline": { "value": "bottom" },
          "text": { "signal": "format(datum.score, '.1f') + '%'" },
          "fontSize": { "value": 50 },
          "fontWeight": { "value": 700 },
          "fill": { "value": checkScoreColor }
        }
      }
    },
    {
      "type": "text",
      "from": { "data": "scoredata" },
      "encode": {
        "enter": {
          "x": { "signal": "width / 2" },
          "y": { "signal": "height / 2 + 30" },
          "align": { "value": "center" },
          "baseline": { "value": "top" },
          "text": { "value": "Score - checks" },
          "fontSize": { "value": 16 },
          "fill": { "value": "#333" }
        }
      }
    }
  ]
}

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
            spec: JSON.stringify(checkScore),
          },
        },
      },
    },

  };
};
