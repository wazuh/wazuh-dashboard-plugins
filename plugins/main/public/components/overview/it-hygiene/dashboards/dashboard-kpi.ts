import { DashboardPanelState } from '../../../../../../../../src/plugins/dashboard/public/application';
import { EmbeddableInput } from '../../../../../../../../src/plugins/embeddable/public';
import {
  getVisStateHistrogramBy,
  getVisStateHorizontalBarByField,
  getVisStateHorizontalBarByFieldWithDynamicColors,
} from '../common/saved-vis/generators';
import { HEIGHT, STYLE } from '../common/saved-vis/constants';
import {
  createIndexPatternReferences,
  createSearchSource,
} from '../common/saved-vis/create-saved-vis-data';

const getVisStateHostsTotalFreeMemoryTable = (
   indexPatternId: string,
  field: string,
  title: string,
  visIDPrefix: string,
  options: {
    excludeTerm?: string;
    size?: number;
    perPage?: number;
    customLabel?: string;
  } = {},
) => {
  const { excludeTerm, size = 5, perPage = 5, customLabel } = options;

  return {
    id: `${visIDPrefix}-${field}`,
    title,
    type: 'table',
    params: {
      perPage: perPage,
      percentageCol: '',
      row: true,
      showMetricsAtAllLevels: false,
      showPartialRows: false,
      showTotal: false,
      totalFunc: 'sum',
    },
    uiState: {
      vis: {
        columnsWidth: [
          {
            colIndex: 1,
            width: 75,
          },
        ],
      },
    },
    data: {
      searchSource: createSearchSource(indexPatternId),
      references: createIndexPatternReferences(indexPatternId),
      aggs: [
        {
          id: '1',
          enabled: true,
          type: 'count',
          params: {
            customLabel: 'Count',
          },
          schema: 'metric',
        },
        {
          id: '2',
          enabled: true,
          type: 'terms',
          params: {
            field,
            orderBy: '1',
            order: 'asc',
            size,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel,
            ...(excludeTerm ? { json: `{"exclude":"${excludeTerm}"}` } : {}),
            /*json: "\
              {\
                \"script\": {\
                  \"source\": \" \
                    float in_drops=(doc['host.network.ingress.drops'].size() != 0 ? doc['host.network.ingress.drops'].value : 0); \
                    float in_errors=(doc['host.network.ingress.errors'].size() != 0 ? doc['host.network.ingress.errors'].value : 0); \
                    float in_packets=(doc['host.network.ingress.packets'].size() != 0 ? doc['host.network.ingress.packets'].value : 0); \
                    float out_drops=(doc['host.network.egress.drops'].size() != 0 ? doc['host.network.egress.drops'].value : 0); \
                    float out_errors=(doc['host.network.egress.errors'].size() != 0 ? doc['host.network.egress.errors'].value : 0); \
                    float out_packets=(doc['host.network.egress.packets'].size() != 0 ? doc['host.network.egress.packets'].value : 0); \
                    float d=(in_drops + out_drops); \
                    float p=(in_drops + in_errors + in_packets + out_drops + out_errors + out_packets); \
                    return p == 0 ? 0 : Math.round((d/p)*100*100);\", \
                  \"lang\": \"painless\" \
                }\
              }"*/
          },
          schema: 'bucket',
        },
      ],
    },
  };
};

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
            customLabel: 'Operating systems',
          },
          schema: 'metric',
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
          type: 'cardinality',
          params: {
            field: 'package.name',
            customLabel: 'Packages',
          },
          schema: 'metric',
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
                  query: 'process.state:Zombie',
                  language: 'kuery',
                },
                label: 'Zombie processes',
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
        w: 16,
        h: 9,
        x: 0,
        y: 0,
        i: 's1',
      },
      type: 'visualization',
      explicitInput: {
        id: 's1',
        savedVis: getVisStateHorizontalBarByFieldWithDynamicColors(
          indexPatternId,
          'destination.port',
          'Top 5 local ports',
          'it-hygiene-top-operating-system-names',
          'Top ports',
        ),
      },
    },
    s2: {
      gridData: {
        w: 16,
        h: 9,
        x: 16,
        y: 0,
        i: 's2',
      },
      type: 'visualization',
      explicitInput: {
        id: 's2',
        savedVis: getVisStateHistrogramBy(
          indexPatternId,
          'process.start',
          'Processes initiation',
          'it-hygiene-processes',
          'h',
        ),
      },
    },
    s3: {
      gridData: {
        w: 16,
        h: 9,
        x: 32,
        y: 0,
        i: 's3',
      },
      type: 'visualization',
      explicitInput: {
        id: 's3',
       savedVis: getVisStateHostsTotalFreeMemoryTable(
        indexPatternId,
        'host.memory.total',
        'Top 5 host total memory',
        'it-hygiene-stat',
        { customLabel: 'Hosts total memory' }
        )
      },
    },
  };
};
