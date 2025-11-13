import {
  buildIndexPatternReferenceList,
  buildSearchSource,
} from '../../../../lib';
import type { SavedVis } from '../../../../types';

export const getVisStateMaxRuleLevel = (indexPatternId: string): SavedVis => {
  return {
    id: 'wz-vis-overview-office-metric-max-rule-level',
    title: 'Max Rule Level',
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
      searchSource: buildSearchSource(indexPatternId),
      references: buildIndexPatternReferenceList(indexPatternId),
      aggs: [
        {
          id: '1',
          enabled: true,
          type: 'max',
          params: {
            field: 'rule.level',
            customLabel: '- Max Rule Level -',
          },
          schema: 'metric',
        },
      ],
    },
  };
};

export const getVisStateSuspiciousDownloads = (
  indexPatternId: string,
): SavedVis => {
  return {
    id: 'wz-vis-overview-office-metric-suspicious-downloads',
    title: 'Suspicious Downloads',
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
      searchSource: buildSearchSource(indexPatternId),
      references: buildIndexPatternReferenceList(indexPatternId),
      aggs: [
        {
          id: '1',
          enabled: true,
          type: 'count',
          params: { customLabel: ' ' },
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
                  query: 'rule.id: "91724"',
                  language: 'kuery',
                },
                label: '- Suspicious Downloads',
              },
            ],
          },
          schema: 'group',
        },
      ],
    },
  };
};

export const getVisStateFullAccess = (indexPatternId: string): SavedVis => {
  return {
    id: 'wz-vis-overview-office-metric-fullaccess-permissions',
    title: 'Full Access Permissions',
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
      searchSource: buildSearchSource(indexPatternId),
      references: buildIndexPatternReferenceList(indexPatternId),
      aggs: [
        {
          id: '1',
          enabled: true,
          type: 'count',
          params: { customLabel: ' ' },
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
                  query: 'rule.id: "91725"',
                  language: 'kuery',
                },
                label: '- Full Access Permissions',
              },
            ],
          },
          schema: 'group',
        },
      ],
    },
  };
};

export const getVisStatePhishingMalware = (
  indexPatternId: string,
): SavedVis => {
  return {
    id: 'wz-vis-overview-office-phishing-malware',
    title: 'Authentication success',
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
    uiState: {
      vis: { defaultColors: { '0 - 100': 'rgb(0,104,55)' } },
    },
    data: {
      searchSource: buildSearchSource(indexPatternId),
      references: buildIndexPatternReferenceList(indexPatternId),
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
                    'rule.id: "91556" OR rule.id: "91575" OR rule.id: "91700"',
                  language: 'kuery',
                },
                label: '- Phishing and Malware',
              },
            ],
          },
          schema: 'group',
        },
      ],
    },
  };
};
