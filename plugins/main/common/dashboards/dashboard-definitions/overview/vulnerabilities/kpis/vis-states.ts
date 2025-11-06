import type { SavedVis } from '../../../../types';

export const getVisStateSeverityCritical = (
  indexPatternId: string,
): SavedVis => {
  return {
    id: 'severity_critical_vulnerabilities',
    title: 'Critical',
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
            customLabel: 'Severity',
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
                label: 'Critical',
              },
            ],
          },
          schema: 'group',
        },
      ],
    },
  };
};

export const getVisStateSeverityHigh = (indexPatternId: string): SavedVis => {
  return {
    id: 'severity_high_vulnerabilities',
    title: 'High',
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
            customLabel: 'Severity',
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
                label: 'High',
              },
            ],
          },
          schema: 'group',
        },
      ],
    },
  };
};

export const getVisStateSeverityMedium = (indexPatternId: string): SavedVis => {
  return {
    id: 'severity_medium_vulnerabilities',
    title: 'Medium',
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
            customLabel: 'Severity',
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
                label: 'Medium',
              },
            ],
          },
          schema: 'group',
        },
      ],
    },
  };
};

export const getVisStateSeverityLow = (indexPatternId: string): SavedVis => {
  return {
    id: 'severity_low_vulnerabilities',
    title: 'Low',
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
            customLabel: 'Severity',
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
                label: 'Low',
              },
            ],
          },
          schema: 'group',
        },
      ],
    },
  };
};

export const getVisStateEvaluatedEvaluationPending = (
  indexPatternId: string,
): SavedVis => {
  return {
    id: 'vulnerabilities_evaluation_count',
    title: 'Evaluation',
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
            customLabel: 'Evaluation',
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
                label: 'Pending',
              },
            ],
          },
          schema: 'group',
        },
      ],
    },
  };
};
