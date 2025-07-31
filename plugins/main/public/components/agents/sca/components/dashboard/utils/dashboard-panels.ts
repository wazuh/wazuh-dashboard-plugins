import { DashboardPanelState } from '../../../../../../../../src/plugins/dashboard/public/application';
import { EmbeddableInput } from '../../../../../../../../src/plugins/embeddable/public';
import { getVisStateHistogramBy } from '../common/saved-vis/generators';
import { getVisStateTable } from '../../../../../../services/visualizations';
import {
  getVisStateDonutByField,
  getVisStateHorizontalBarSplitSeries,
} from '../../../../../../services/visualizations';

const checkResultColors = {
  passed: '#209280',
  failed: '#cc5642',
  'Not run': '#6092c0',
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
      isDonut: true,
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

const getOverviewDashboardPanels = (
  indexPatternId: string,
): {
  [panelId: string]: DashboardPanelState<
    EmbeddableInput & { [k: string]: unknown }
  >;
} => {
  return {
    '1': {
      gridData: { w: 24, h: 10, x: 0, y: 0, i: '1' },
      type: 'visualization',
      explicitInput: {
        id: '1',
        savedVis: getVisStateHorizontalBarSplitSeries(
          indexPatternId,
          'agent.name',
          'Top 5 agents by check result',
          'sca-dashboard-top-agents',
          {
            fieldSize: 5,
            metricCustomLabel: 'Top ports count',
            valueAxesTitleText: ' ',
            seriesLabel: 'Top ports',
            seriesMode: 'normal',
            fieldCustomLabel: 'Top ports',
          },
        ),
      },
    },
    '2': {
      gridData: { w: 24, h: 10, x: 24, y: 0, i: '2' },
      type: 'visualization',
      explicitInput: {
        id: '2',
        savedVis: getVisStateCheckResultsDonut(indexPatternId),
      },
    },
    '3': {
      gridData: { w: 24, h: 10, x: 0, y: 10, i: '3' },
      type: 'visualization',
      explicitInput: {
        id: '3',
        savedVis: getVisStateCheckResultsByPolicy(indexPatternId),
      },
    },
    '4': {
      gridData: { w: 12, h: 10, x: 24, y: 10, i: '4' },
      type: 'visualization',
      explicitInput: {
        id: '4',
        savedVis: getVisStateTable(
          indexPatternId,
          'agent.name',
          '',
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
    '5': {
      gridData: { w: 12, h: 10, x: 36, y: 10, i: '5' },
      type: 'visualization',
      explicitInput: {
        id: '5',
        savedVis: getVisStateTable(
          indexPatternId,
          'policy.name',
          '',
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

export const getDashboardPanels = (
  indexPatternId: string,
): {
  [panelId: string]: DashboardPanelState<
    EmbeddableInput & { [k: string]: unknown }
  >;
} => {
  return getOverviewDashboardPanels(indexPatternId);
};
