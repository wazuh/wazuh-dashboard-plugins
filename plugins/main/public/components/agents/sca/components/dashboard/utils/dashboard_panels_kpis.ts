import { DashboardPanelState } from '../../../../../../../../../src/plugins/dashboard/public/application';
import { EmbeddableInput } from '../../../../../../../../../src/plugins/embeddable/public';
import { getVisStateTable } from '../../../../../../services/visualizations';

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

const getVisStateCheckResultsDonut = (indexPatternId: string) => {
  return {
    id: 'check_result_donut',
    title: 'Check Results Distribution',
    type: 'pie',
    uiState: {
      vis: {
        colors: checkResultColors,
      },
    },
    params: {
      addLegend: true,
      addTooltip: true,
      isDonut: true, // ✅ Donut style
      legendPosition: 'right',
      labels: {
        show: true,
        position: 'default',
        truncate: 100,
        last_level: true,
        values: true,
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
        {
          id: '2',
          enabled: true,
          type: 'terms',
          schema: 'segment',
          params: {
            field: 'check.result',
            size: 5,
            order: 'desc',
            orderBy: '1',
            customLabel: 'Check Result',
          },
        },
      ],
    },
  };
};

export const getVisStateTopFailedPolicies = (indexPatternId: string) => ({
  id: 'top_failed_policies',
  title: 'Top 5 failed Policies',
  type: 'table',
  uiState: {
    vis: {
      colors: checkResultColors,
    },
  },
  params: {
    addTooltip: true,
    addLegend: false,
    orientation: 'horizontal',
    truncateLegend: true,
    categoryAxes: [{ position: 'left' }],
    valueAxes: [{ position: 'bottom' }],
  },
  data: {
    searchSource: {
      query: {
        language: 'kuery',
        query: 'check.result: "failed"',
      },
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
        params: { customLabel: 'failed Checks' },
      },
      {
        id: '2',
        enabled: true,
        type: 'terms',
        schema: 'segment',
        params: {
          field: 'policy.name',
          size: 5,
          order: 'desc',
          orderBy: '1',
          customLabel: 'Policy Name',
        },
      },
    ],
  },
});

export const getVisStateResultsByAgent = (indexPatternId: string) => ({
  id: 'results_by_agent',
  title: 'Check results by agent',
  type: 'horizontal_bar',
  params: {
    addTooltip: true,
    addLegend: true,
    isStacked: true,
    legendPosition: 'right',
    categoryAxes: [{ position: 'left' }],
    valueAxes: [{ position: 'bottom' }],
  },
  uiState: {
    vis: {
      colors: checkResultColors,
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
        type: 'terms',
        schema: 'segment',
        params: {
          field: 'agent.name',
          size: 10,
          order: 'desc',
          customLabel: 'Agents',
        },
      },
      {
        id: '2',
        enabled: true,
        type: 'terms',
        schema: 'group',
        params: {
          field: 'check.result',
          size: 5,
          order: 'desc',
          customLabel: 'Result',
        },
      },
    ],
  },
});

export const getVisStateCheckResultsByPolicy = (indexPatternId: string) => ({
  id: 'sca-checks-by-policy',
  title: 'Check Results by Policy',
  type: 'horizontal_bar',
  uiState: {
    vis: {
      colors: checkResultColors,
    },
  },
  params: {
    addLegend: true,
    addTooltip: true,
    legendPosition: 'right',
    labels: {
      show: true,
      position: 'default',
      truncate: 100,
      last_level: true,
      values: true,
    },
    categoryAxes: [
      {
        id: 'CategoryAxis-1',
        type: 'category',
        position: 'left',
        show: true,
        labels: {
          show: true,
        },
      },
    ],
    valueAxes: [
      {
        id: 'ValueAxis-1',
        name: 'LeftAxis-1',
        type: 'value',
        position: 'bottom',
        show: true,
        scale: {
          type: 'linear',
        },
        labels: {
          show: true,
        },
        title: {
          text: 'Checks',
        },
      },
    ],
    seriesParams: [
      {
        data: {
          id: '1',
          label: 'Count',
        },
        drawLinesBetweenPoints: false,
        mode: 'stacked',
        show: true,
        type: 'bar',
        valueAxis: 'ValueAxis-1',
      },
    ],
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
        params: { customLabel: 'Checks' },
      },
      {
        id: '2',
        enabled: true,
        type: 'terms',
        schema: 'segment',
        params: {
          field: 'policy.name',
          size: 10,
          orderBy: '1',
          order: 'desc',
          customLabel: 'Policy',
        },
      },
      {
        id: '3',
        enabled: true,
        type: 'terms',
        schema: 'group',
        params: {
          field: 'check.result',
          size: 5,
          orderBy: '1',
          order: 'desc',
          customLabel: 'Result',
        },
      },
    ],
  },
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
        savedVis: getVisStateTotalChecks(indexPatternId),
      },
    },
    '5': {
      gridData: { w: 24, h: 10, x: 0, y: 18, i: '5' },
      type: 'visualization',
      explicitInput: {
        id: '5',
        savedVis: getVisStateResultsByAgent(indexPatternId),
      },
    },
    '6': {
      gridData: { w: 24, h: 10, x: 24, y: 6, i: '6' },
      type: 'visualization',
      explicitInput: {
        id: '6',
        savedVis: getVisStateCheckResultsDonut(indexPatternId),
      },
    },
    '7': {
      gridData: { w: 24, h: 10, x: 0, y: 28, i: '7' },
      type: 'visualization',
      explicitInput: {
        id: '7',
        savedVis: getVisStateCheckResultsByPolicy(indexPatternId),
      },
    },
    '8': {
      gridData: { w: 12, h: 10, x: 24, y: 28, i: '8' },
      type: 'visualization',
      explicitInput: {
        id: '8',
        savedVis: getVisStateTable(
          indexPatternId,
          'agent.name',
          'Checks Not Run by Agent',
          'sca-not-run-agents',
          {
            fieldCustomLabel: 'Not Run',
            filters: [
              {
                meta: {
                  disabled: false,
                  key: 'check.result',
                  negate: false,
                  type: 'phrase',
                  value: 'Not run',
                },
                query: {
                  match_phrase: {
                    'check.result': 'Not run',
                  },
                },
              },
            ],
          },
        ),
      },
    },
    '9': {
      gridData: { w: 12, h: 10, x: 36, y: 18, i: '9' },
      type: 'visualization',
      explicitInput: {
        id: '9',
        savedVis: getVisStateTable(
          indexPatternId,
          'policy.name',
          'Top 5 failed Policies',
          'sca-top-failed-policies',
          {
            fieldCustomLabel: 'Failed Policies',
            filters: [
              {
                meta: {
                  disabled: false,
                  key: 'check.result',
                  negate: false,
                  type: 'phrase',
                  value: 'failed',
                },
                query: {
                  match_phrase: {
                    'check.result': 'failed',
                  },
                },
              },
            ],
          },
        ),
      },
    },
  };
};
