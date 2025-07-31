import { DashboardPanelState } from '../../../../../../../../../src/plugins/dashboard/public/application';
import { EmbeddableInput } from '../../../../../../../../../src/plugins/embeddable/public';

const checkResultColors = {
  passed: '#209280',
  failed: '#cc5642',
  'Not run': '#6092c0',
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
          params: { customLabel: 'Passed' },
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
                label: 'Checks',
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
          params: { customLabel: 'failed' },
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
                label: 'Checks',
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
          params: { customLabel: 'Not run' },
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
                label: 'Checks',
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
        savedVis: getVisStateTotalChecks(indexPatternId),
      },
    },
    ////////////////
    // '5': {
    //   gridData: { w: 24, h: 10, x: 0, y: 18, i: '5' },
    //   type: 'visualization',
    //   explicitInput: {
    //     id: '5',
    //     savedVis: getVisStateResultsByAgent(indexPatternId),
    //   },
    // },
    // '6': {
    //   gridData: { w: 24, h: 10, x: 24, y: 6, i: '6' },
    //   type: 'visualization',
    //   explicitInput: {
    //     id: '6',
    //     savedVis: getVisStateCheckResultsDonut(indexPatternId),
    //   },
    // },
    // '7': {
    //   gridData: { w: 24, h: 10, x: 0, y: 28, i: '7' },
    //   type: 'visualization',
    //   explicitInput: {
    //     id: '7',
    //     savedVis: getVisStateCheckResultsByPolicy(indexPatternId),
    //   },
    // },
    // '8': {
    //   gridData: { w: 12, h: 10, x: 24, y: 28, i: '8' },
    //   type: 'visualization',
    //   explicitInput: {
    //     id: '8',
    //     savedVis: getVisStateTable(
    //       indexPatternId,
    //       'agent.name',
    //       'Checks Not Run by Agent',
    //       'sca-not-run-agents',
    //       {
    //         fieldCustomLabel: 'Not Run',
    //         filters: [
    //           {
    //             meta: {
    //               disabled: false,
    //               key: 'check.result',
    //               negate: false,
    //               type: 'phrase',
    //               value: 'Not run',
    //             },
    //             query: {
    //               match_phrase: {
    //                 'check.result': 'Not run',
    //               },
    //             },
    //           },
    //         ],
    //       },
    //     ),
    //   },
    // },
    // '9': {
    //   gridData: { w: 12, h: 10, x: 36, y: 18, i: '9' },
    //   type: 'visualization',
    //   explicitInput: {
    //     id: '9',
    //     savedVis: getVisStateTable(
    //       indexPatternId,
    //       'policy.name',
    //       'Top 5 failed Policies',
    //       'sca-top-failed-policies',
    //       {
    //         fieldCustomLabel: 'Failed Policies',
    //         filters: [
    //           {
    //             meta: {
    //               disabled: false,
    //               key: 'check.result',
    //               negate: false,
    //               type: 'phrase',
    //               value: 'failed',
    //             },
    //             query: {
    //               match_phrase: {
    //                 'check.result': 'failed',
    //               },
    //             },
    //           },
    //         ],
    //       },
    //     ),
    //   },
    // },
    ////////////////////////////////
  };
};
