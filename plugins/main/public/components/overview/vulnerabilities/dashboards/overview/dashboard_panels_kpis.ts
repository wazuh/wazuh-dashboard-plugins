import { i18n } from '@osd/i18n';
import { DashboardPanelState } from '../../../../../../../../src/plugins/dashboard/public/application';
import { EmbeddableInput } from '../../../../../../../../src/plugins/embeddable/public';

const getVisStateSeverityCritical = (indexPatternId: string) => {
  return {
    id: 'severity_critical_vulnerabilities',
    title: i18n.translate('wazuh.vulnerabilityDetection.kpi.critical.title', {
      defaultMessage: 'Critical',
    }),
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
          params: {
            customLabel: i18n.translate(
              'wazuh.vulnerabilityDetection.kpi.critical.metricLabel',
              { defaultMessage: 'Severity' },
            ),
          },
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
                  query: 'vulnerability.severity:"Critical"',
                  language: 'kuery',
                },
                label: i18n.translate(
                  'wazuh.vulnerabilityDetection.kpi.critical.filterLabel',
                  { defaultMessage: 'Critical' },
                ),
              },
            ],
          },
          schema: 'group',
        },
      ],
    },
  };
};

const getVisStateSeverityHigh = (indexPatternId: string) => {
  return {
    id: 'severity_high_vulnerabilities',
    title: i18n.translate('wazuh.vulnerabilityDetection.kpi.high.title', {
      defaultMessage: 'High',
    }),
    type: 'metric',
    params: {
      addTooltip: true,
      addLegend: false,
      type: 'metric',
      metric: {
        percentageMode: false,
        useRanges: false,
        colorSchema: 'Yellow to Red',
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
        invertColors: true,
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
          params: {
            customLabel: i18n.translate(
              'wazuh.vulnerabilityDetection.kpi.high.metricLabel',
              { defaultMessage: 'Severity' },
            ),
          },
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
                  query: 'vulnerability.severity:"High"',
                  language: 'kuery',
                },
                label: i18n.translate(
                  'wazuh.vulnerabilityDetection.kpi.high.filterLabel',
                  { defaultMessage: 'High' },
                ),
              },
            ],
          },
          schema: 'group',
        },
      ],
    },
  };
};

const getVisStateSeverityMedium = (indexPatternId: string) => {
  return {
    id: 'severity_medium_vulnerabilities',
    title: i18n.translate('wazuh.vulnerabilityDetection.kpi.medium.title', {
      defaultMessage: 'Medium',
    }),
    type: 'metric',
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
          params: {
            customLabel: i18n.translate(
              'wazuh.vulnerabilityDetection.kpi.medium.metricLabel',
              { defaultMessage: 'Severity' },
            ),
          },
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
                  query: 'vulnerability.severity:"Medium"',
                  language: 'kuery',
                },
                label: i18n.translate(
                  'wazuh.vulnerabilityDetection.kpi.medium.filterLabel',
                  { defaultMessage: 'Medium' },
                ),
              },
            ],
          },
          schema: 'group',
        },
      ],
    },
  };
};

const getVisStateSeverityLow = (indexPatternId: string) => {
  return {
    id: 'severity_low_vulnerabilities',
    title: i18n.translate('wazuh.vulnerabilityDetection.kpi.low.title', {
      defaultMessage: 'Low',
    }),
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
          params: {
            customLabel: i18n.translate(
              'wazuh.vulnerabilityDetection.kpi.low.metricLabel',
              { defaultMessage: 'Severity' },
            ),
          },
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
                  query: 'vulnerability.severity:"Low"',
                  language: 'kuery',
                },
                label: i18n.translate(
                  'wazuh.vulnerabilityDetection.kpi.low.filterLabel',
                  { defaultMessage: 'Low' },
                ),
              },
            ],
          },
          schema: 'group',
        },
      ],
    },
  };
};

const getVisStateEvaluatedEvaluationPending = (indexPatternId: string) => {
  return {
    id: 'vulnerabilities_evaluation_count',
    title: i18n.translate('wazuh.vulnerabilityDetection.kpi.evaluation.title', {
      defaultMessage: 'Evaluation',
    }),
    type: 'metric',
    params: {
      addLegend: false,
      addTooltip: true,
      metric: {
        colorSchema: 'Green to Red',
        colorsRange: [
          {
            from: 0,
            to: 10000,
          },
        ],
        invertColors: false,
        labels: {
          show: true,
        },
        metricColorMode: 'None',
        percentageMode: false,
        style: {
          bgColor: false,
          bgFill: '#000',
          fontSize: 40,
          labelColor: false,
          subText: '',
        },
        useRanges: false,
      },
      type: 'metric',
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
          params: {
            customLabel: i18n.translate(
              'wazuh.vulnerabilityDetection.kpi.evaluation.metricLabel',
              { defaultMessage: 'Evaluation' },
            ),
          },
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
                  language: 'kuery',
                  query: 'vulnerability.under_evaluation:true',
                },
                label: i18n.translate(
                  'wazuh.vulnerabilityDetection.kpi.evaluation.pendingLabel',
                  { defaultMessage: 'Pending' },
                ),
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
        w: 9,
        h: 6,
        x: 0,
        y: 0,
        i: '1',
      },
      type: 'visualization',
      explicitInput: {
        id: '1',
        savedVis: getVisStateSeverityCritical(indexPatternId),
      },
    },
    '2': {
      gridData: {
        w: 9,
        h: 6,
        x: 9,
        y: 0,
        i: '2',
      },
      type: 'visualization',
      explicitInput: {
        id: '2',
        savedVis: getVisStateSeverityHigh(indexPatternId),
      },
    },
    '3': {
      gridData: {
        w: 9,
        h: 6,
        x: 18,
        y: 0,
        i: '3',
      },
      type: 'visualization',
      explicitInput: {
        id: '3',
        savedVis: getVisStateSeverityMedium(indexPatternId),
      },
    },
    '4': {
      gridData: {
        w: 9,
        h: 6,
        x: 27,
        y: 0,
        i: '4',
      },
      type: 'visualization',
      explicitInput: {
        id: '4',
        savedVis: getVisStateSeverityLow(indexPatternId),
      },
    },
    '5': {
      gridData: {
        w: 12,
        h: 6,
        x: 36,
        y: 0,
        i: '5',
      },
      type: 'visualization',
      explicitInput: {
        id: '5',
        savedVis: getVisStateEvaluatedEvaluationPending(indexPatternId),
      },
    },
  };
};
