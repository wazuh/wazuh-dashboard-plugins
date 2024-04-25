import { DashboardPanelState } from '../../../../../../../../src/plugins/dashboard/public/application';
import { EmbeddableInput } from '../../../../../../../../src/plugins/embeddable/public';

const getVisStateTotal = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Overview-General-Metric-alerts',
    title: 'Total',
    type: 'metric',
    params: {
      addTooltip: true,
      addLegend: false,
      type: 'metric',
      metric: {
        percentageMode: false,
        useRanges: false,
        colorSchema: 'Greens',
        metricColorMode: 'Labels',
        colorsRange: [
          {
            from: 0,
            to: 0,
          },
          {
            from: 0,
            to: 0,
          },
        ],
        labels: {
          show: true,
        },
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
        query: {
          language: 'kuery',
          query: '',
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
          params: { customLabel: '- Total -' },
        },
      ],
    },
  };
};

const getVisStateLevel12Alerts = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Overview-General-Level-12-alerts',
    title: 'Level 12 or above alerts',
    type: 'metric',
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
            from: 0,
            to: 0,
          },
          {
            from: 0,
            to: 0,
          },
        ],
        labels: {
          show: true,
        },
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
        query: {
          language: 'kuery',
          query: '',
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
          params: { customLabel: ' ' },
        },
        {
          id: '2',
          enabled: true,
          type: 'filters',
          params: {
            filters: [
              {
                input: {
                  query: 'rule.level >= 12',
                  language: 'kuery',
                },
                label: '- Level 12 or above alerts',
              },
            ],
          },
          schema: 'group',
        },
      ],
    },
  };
};

const getVisStateAuthenticationFailure = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Overview-General-Authentication-failure',
    title: 'Authentication failure',
    type: 'metric',
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
            from: 0,
            to: 0,
          },
          {
            from: 0,
            to: 0,
          },
        ],
        labels: {
          show: true,
        },
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
        query: {
          language: 'kuery',
          query: '',
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
          params: { customLabel: ' ' },
        },
        {
          id: '2',
          enabled: true,
          type: 'filters',
          params: {
            filters: [
              {
                input: {
                  query:
                    'rule.groups: "win_authentication_failed" OR rule.groups: "authentication_failed" OR rule.groups: "authentication_failures"',
                  language: 'kuery',
                },
                label: '- Authentication failure',
              },
            ],
          },
          schema: 'group',
        },
      ],
    },
  };
};

const getVisStateAuthenticationSuccess = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Overview-General-Authentication-success',
    title: 'Authentication success',
    type: 'metric',
    params: {
      addTooltip: true,
      addLegend: false,
      type: 'metric',
      metric: {
        percentageMode: false,
        useRanges: false,
        colorSchema: 'Greens',
        metricColorMode: 'Labels',
        colorsRange: [
          {
            from: 0,
            to: 0,
          },
          {
            from: 0,
            to: 0,
          },
        ],
        labels: {
          show: true,
        },
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
    uiState: {
      vis: { defaultColors: { '0 - 100': 'rgb(0,104,55)' } },
    },
    data: {
      searchSource: {
        query: {
          language: 'kuery',
          query: '',
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
          params: { customLabel: ' ' },
        },
        {
          id: '2',
          enabled: true,
          type: 'filters',
          params: {
            filters: [
              {
                input: {
                  query: 'rule.groups: "authentication_success"',
                  language: 'kuery',
                },
                label: '- Authentication success',
              },
            ],
          },
          schema: 'group',
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
      gridData: {
        w: 12,
        h: 6,
        x: 0,
        y: 0,
        i: '1',
      },
      type: 'visualization',
      explicitInput: {
        id: '1',
        savedVis: getVisStateTotal(indexPatternId),
      },
    },
    '2': {
      gridData: {
        w: 12,
        h: 6,
        x: 12,
        y: 0,
        i: '2',
      },
      type: 'visualization',
      explicitInput: {
        id: '2',
        savedVis: getVisStateLevel12Alerts(indexPatternId),
      },
    },
    '3': {
      gridData: {
        w: 12,
        h: 6,
        x: 24,
        y: 0,
        i: '3',
      },
      type: 'visualization',
      explicitInput: {
        id: '3',
        savedVis: getVisStateAuthenticationFailure(indexPatternId),
      },
    },
    '4': {
      gridData: {
        w: 12,
        h: 6,
        x: 36,
        y: 0,
        i: '4',
      },
      type: 'visualization',
      explicitInput: {
        id: '4',
        savedVis: getVisStateAuthenticationSuccess(indexPatternId),
      },
    },
  };
};
