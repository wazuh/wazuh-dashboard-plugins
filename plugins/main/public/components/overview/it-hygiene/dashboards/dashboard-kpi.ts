import { DashboardPanelState } from '../../../../../../../../src/plugins/dashboard/public/application';
import { EmbeddableInput } from '../../../../../../../../src/plugins/embeddable/public';

const getVisStateStatOperatingSystems = (indexPatternId: string) => {
  return {
    id: 'it-hygiene-stat-unique-operating-systems',
    title: 'Unique operating systems',
    type: 'metric',
    params: {
      addTooltip: true,
      addLegend: false,
      type: 'metric',
      metric: {
        percentageMode: false,
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
          type: 'cardinality',
          params: {
            field: 'host.os.full',
            customLabel: 'Unique count',
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
                  query: 'host.os.full:*',
                  language: 'kuery',
                },
                label: 'Operating systems',
              },
            ],
          },
          schema: 'group',
        },
      ],
    },
  };
};

const getVisStateStatPackages = (indexPatternId: string) => {
  return {
    id: 'it-hygiene-stat-packages',
    title: 'Packages',
    type: 'metric',
    params: {
      addTooltip: true,
      addLegend: false,
      type: 'metric',
      metric: {
        percentageMode: false,
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
          params: {},
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
                  query: 'package.name:*',
                  language: 'kuery',
                },
                label: 'Packages',
              },
            ],
          },
          schema: 'group',
        },
      ],
    },
  };
};

const getVisStateStatProcesses = (indexPatternId: string) => {
  return {
    id: 'it-hygiene-stat-processes',
    title: 'Processes',
    type: 'metric',
    params: {
      addTooltip: true,
      addLegend: false,
      type: 'metric',
      metric: {
        percentageMode: false,
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
          params: {},
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
                  query: 'process.command_line:*',
                  language: 'kuery',
                },
                label: 'Processes',
              },
            ],
          },
          schema: 'group',
        },
      ],
    },
  };
};

const getVisStateStatNetworkInterfaces = (indexPatternId: string) => {
  return {
    id: 'it-hygiene-stat-network-interfaces',
    title: 'Network interfaces',
    type: 'metric',
    params: {
      addTooltip: true,
      addLegend: false,
      type: 'metric',
      metric: {
        percentageMode: false,
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
          params: {},
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
                  query: 'observer.ingress.interface.name:*',
                  language: 'kuery',
                },
                label: 'Network interfaces',
              },
            ],
          },
          schema: 'group',
        },
      ],
    },
  };
};

export const getDashboardKPIs = (
  indexPatternId: string,
): {
  [panelId: string]: DashboardPanelState<
    EmbeddableInput & { [k: string]: unknown }
  >;
} => {
  return {
    s1: {
      gridData: {
        w: 12,
        h: 6,
        x: 0,
        y: 0,
        i: 's1',
      },
      type: 'visualization',
      explicitInput: {
        id: 's1',
        savedVis: getVisStateStatPackages(indexPatternId),
      },
    },
    s2: {
      gridData: {
        w: 12,
        h: 6,
        x: 12,
        y: 0,
        i: 's2',
      },
      type: 'visualization',
      explicitInput: {
        id: 's2',
        savedVis: getVisStateStatProcesses(indexPatternId),
      },
    },
    s3: {
      gridData: {
        w: 12,
        h: 6,
        x: 24,
        y: 0,
        i: 's3',
      },
      type: 'visualization',
      explicitInput: {
        id: 's3',
        savedVis: getVisStateStatNetworkInterfaces(indexPatternId),
      },
    },
    s4: {
      gridData: {
        w: 12,
        h: 6,
        x: 36,
        y: 0,
        i: 's4',
      },
      type: 'visualization',
      explicitInput: {
        id: 's4',
        savedVis: getVisStateStatOperatingSystems(indexPatternId),
      },
    },
  };
};
