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

export const getVisStatePolicyByCheckHeatmap = (indexPatternId: string) => ({
  id: 'policies_by_agent',
  title: 'Policies by agent ID',
  type: 'heatmap',
  params: {
    type: 'heatmap',
    addTooltip: true,
    addLegend: true,
    enableHover: false,
    legendPosition: 'right',
    times: [],
    colorsNumber: 4,
    colorSchema: 'Reds',
    setColorRange: false,
    colorsRange: [],
    invertColors: false,
    percentageMode: false,
    valueAxes: [
      {
        show: false,
        id: 'ValueAxis-1',
        type: 'value',
        scale: {
          type: 'linear',
          defaultYExtents: false,
        },
        labels: {
          show: false,
          rotate: 75,
          overwriteColor: false,
          color: 'black',
          truncate: 20,
        },
      },
    ],
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
        type: 'count',
        params: {
          customLabel: ' ',
        },
        schema: 'metric',
      },
      {
        id: '2',
        enabled: true,
        type: 'terms',
        params: {
          field: 'agent.id',
          orderBy: '1',
          order: 'desc',
          size: 20,
          otherBucket: false,
          otherBucketLabel: 'Other',
          missingBucket: false,
          missingBucketLabel: 'Missing',
          customLabel: 'Checks',
        },
        schema: 'segment',
      },
      {
        id: '3',
        enabled: true,
        type: 'terms',
        params: {
          field: 'policy.name',
          orderBy: '1',
          order: 'desc',
          size: 5,
          otherBucket: false,
          otherBucketLabel: 'Other',
          missingBucket: false,
          missingBucketLabel: 'Missing',
          customLabel: 'Policies',
        },
        schema: 'group',
      },
    ],
  },
});

export const getVisStateResultsByAgent = (indexPatternId: string) => ({
  id: 'results_by_agent',
  title: 'Agents by check result',
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
          show: true,
          truncate: 200,
        },
        position: 'left',
        scale: {
          type: 'linear',
        },
        show: true,
        style: {},
        title: {},
        type: 'category',
      },
    ],
    grid: {
      categoryLines: false,
    },
    labels: {},
    legendPosition: 'right',
    row: true,
    seriesParams: [
      {
        data: {
          id: '1',
          label: ' ',
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
      value: 10,
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
        },
        show: true,
        style: {},
        title: {
          text: ' ',
        },
        type: 'value',
      },
    ],
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
        type: 'count',
        params: {
          customLabel: ' ',
        },
        schema: 'metric',
      },
      {
        id: '2',
        enabled: true,
        type: 'terms',
        params: {
          field: 'agent.name',
          orderBy: '1',
          order: 'desc',
          size: 5,
          otherBucket: false,
          otherBucketLabel: 'Other',
          missingBucket: false,
          missingBucketLabel: 'Missing',
          customLabel: 'Agents',
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
  },
});

export const getVisStateCheckResultsByPolicy = (indexPatternId: string) => ({
  id: 'policies_by_result',
  title: 'Policies by check result',
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
          show: true,
          truncate: 200,
        },
        position: 'left',
        scale: {
          type: 'linear',
        },
        show: true,
        style: {},
        title: {},
        type: 'category',
      },
    ],
    grid: {
      categoryLines: false,
    },
    labels: {},
    legendPosition: 'right',
    row: true,
    seriesParams: [
      {
        data: {
          id: '1',
          label: ' ',
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
      value: 10,
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
        },
        show: true,
        style: {},
        title: {
          text: ' ',
        },
        type: 'value',
      },
    ],
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
        type: 'count',
        params: {
          customLabel: ' ',
        },
        schema: 'metric',
      },
      {
        id: '2',
        enabled: true,
        type: 'terms',
        params: {
          field: 'policy.name',
          orderBy: '1',
          order: 'desc',
          size: 5,
          otherBucket: false,
          otherBucketLabel: 'Other',
          missingBucket: false,
          missingBucketLabel: 'Missing',
          customLabel: 'Policies',
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
        savedVis: getVisStateResultsByAgent(indexPatternId),
      },
    },
    '2': {
      gridData: { w: 24, h: 10, x: 24, y: 0, i: '2' },
      type: 'visualization',
      explicitInput: {
        id: '2',
        // savedVis: getVisStateCheckResultsDonut(indexPatternId),
        savedVis: getVisStateCheckResultsByPolicy(indexPatternId),
      },
    },
    '3': {
      gridData: { w: 48, h: 12, x: 0, y: 10, i: '3' },
      type: 'visualization',
      explicitInput: {
        id: '3',
        savedVis: getVisStatePolicyByCheckHeatmap(indexPatternId),
      },
    },
    // '4': {
    //   gridData: { w: 24, h: 10, x: 24, y: 10, i: '4' },
    //   type: 'visualization',
    //   explicitInput: {
    //     id: '4',
    //     savedVis: getVisStatePolicyByCheckHeatmap(indexPatternId),
    //   },
    // },
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
