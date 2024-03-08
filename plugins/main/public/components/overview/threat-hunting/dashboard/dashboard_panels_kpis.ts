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
          params: { customLabel: 'Total' },
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
        filter: [
          {
            $state: {
              store: 'appState',
            },
            meta: {
              alias: null,
              disabled: false,
              index: 'wazuh-alerts',
              key: 'rule.level',
              negate: false,
              params: {
                gte: 12,
                lt: null,
              },
              type: 'range',
              value: '12 to +∞',
            },
            range: {
              'rule.level': {
                gte: 12,
                lt: null,
              },
            },
          },
        ],
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
          params: { customLabel: 'Level 12 or above alerts' },
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
        filter: [
          {
            meta: {
              index: 'wazuh-alerts',
              type: 'phrases',
              key: 'rule.groups',
              value:
                'win_authentication_failed, authentication_failed, authentication_failures',
              params: [
                'win_authentication_failed',
                'authentication_failed',
                'authentication_failures',
              ],
              negate: false,
              disabled: false,
              alias: null,
            },
            query: {
              bool: {
                should: [
                  {
                    match_phrase: {
                      'rule.groups': 'win_authentication_failed',
                    },
                  },
                  {
                    match_phrase: {
                      'rule.groups': 'authentication_failed',
                    },
                  },
                  {
                    match_phrase: {
                      'rule.groups': 'authentication_failures',
                    },
                  },
                ],
                minimum_should_match: 1,
              },
            },
            $state: {
              store: 'appState',
            },
          },
        ],
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
          params: { customLabel: 'Authentication failure' },
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
        filter: [
          {
            meta: {
              index: 'wazuh-alerts',
              negate: false,
              disabled: false,
              alias: null,
              type: 'phrase',
              key: 'rule.groups',
              value: 'authentication_success',
              params: {
                query: 'authentication_success',
                type: 'phrase',
              },
            },
            query: {
              match: {
                'rule.groups': {
                  query: 'authentication_success',
                  type: 'phrase',
                },
              },
            },
            $state: {
              store: 'appState',
            },
          },
        ],
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
          params: { customLabel: 'Authentication success' },
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
