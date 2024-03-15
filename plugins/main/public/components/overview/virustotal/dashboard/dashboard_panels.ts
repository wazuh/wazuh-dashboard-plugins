import { DashboardPanelState } from '../../../../../../../../src/plugins/dashboard/public/application';
import { EmbeddableInput } from '../../../../../../../../src/plugins/embeddable/public';

/* WARNING: The panel id must be unique including general and agents visualizations. Otherwise, the visualizations will not refresh when we pin an agent, because they are cached by id */

/* Overview visualizations */

const getVisStateTop5UniqueMaliciousFilesPerAgent = (
  indexPatternId: string,
) => {
  return {
    id: 'Wazuh-App-Overview-Virustotal-Malicious-Per-Agent',
    title: 'Top 5 agents with unique malicious files',
    type: 'pie',
    params: {
      type: 'pie',
      addTooltip: true,
      addLegend: true,
      legendPosition: 'right',
      isDonut: true,
      labels: {
        show: false,
        values: true,
        last_level: true,
        truncate: 100,
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
              negate: true,
              disabled: false,
              alias: null,
              type: 'phrase',
              key: 'data.virustotal.malicious',
              value: '0',
              params: {
                query: '0',
                type: 'phrase',
              },
            },
            query: {
              match: {
                'data.virustotal.malicious': {
                  query: '0',
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
          type: 'cardinality',
          schema: 'metric',
          params: { field: 'data.virustotal.source.md5' },
        },
        {
          id: '2',
          enabled: true,
          type: 'terms',
          schema: 'segment',
          params: {
            field: 'agent.name',
            size: 5,
            order: 'desc',
            orderBy: '1',
          },
        },
      ],
    },
  };
};

const getVisStateLastScannedFiles = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Overview-Virustotal-Last-Files-Pie',
    title: 'Last scanned files',
    type: 'pie',
    params: {
      type: 'pie',
      addTooltip: true,
      addLegend: true,
      legendPosition: 'right',
      isDonut: true,
      labels: {
        show: false,
        values: true,
        last_level: true,
        truncate: 100,
      },
    },
    uiState: {
      vis: { legendOpen: true },
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
          params: { customLabel: 'Files' },
        },
        {
          id: '2',
          enabled: true,
          type: 'terms',
          schema: 'segment',
          params: {
            field: 'data.virustotal.source.file',
            size: 5,
            order: 'desc',
            orderBy: '1',
          },
        },
      ],
    },
  };
};

const getVisStateAlertsEvolutionByAgents = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Overview-Virustotal-Alerts-Evolution',
    title: 'Alerts evolution by agents',
    type: 'histogram',
    params: {
      type: 'histogram',
      grid: { categoryLines: false },
      categoryAxes: [
        {
          id: 'CategoryAxis-1',
          type: 'category',
          position: 'bottom',
          show: true,
          style: {},
          scale: { type: 'linear' },
          labels: { show: true, filter: true, truncate: 100 },
          title: {},
        },
      ],
      valueAxes: [
        {
          id: 'ValueAxis-1',
          name: 'LeftAxis-1',
          type: 'value',
          position: 'left',
          show: true,
          style: {},
          scale: { type: 'linear', mode: 'normal' },
          labels: { show: true, rotate: 0, filter: false, truncate: 100 },
          title: { text: 'Count' },
        },
      ],
      seriesParams: [
        {
          show: true,
          type: 'histogram',
          mode: 'stacked',
          data: { label: 'Count', id: '1' },
          valueAxis: 'ValueAxis-1',
          drawLinesBetweenPoints: true,
          lineWidth: 2,
          showCircles: true,
        },
      ],
      addTooltip: true,
      addLegend: true,
      legendPosition: 'right',
      times: [],
      addTimeMarker: false,
      labels: { show: false },
      thresholdLine: {
        show: false,
        value: 10,
        width: 1,
        style: 'full',
        color: '#E7664C',
      },
      dimensions: {
        x: {
          accessor: 0,
          format: { id: 'date', params: { pattern: 'YYYY-MM-DD HH:mm' } },
          params: {
            date: true,
            interval: 'PT3H',
            intervalOpenSearchValue: 3,
            intervalOpenSearchUnit: 'h',
            format: 'YYYY-MM-DD HH:mm',
            bounds: {
              min: '2020-04-17T12:11:35.943Z',
              max: '2020-04-24T12:11:35.944Z',
            },
          },
          label: 'timestamp per 3 hours',
          aggType: 'date_histogram',
        },
        y: [
          {
            accessor: 2,
            format: { id: 'number' },
            params: {},
            label: 'Count',
            aggType: 'count',
          },
        ],
        series: [
          {
            accessor: 1,
            format: {
              id: 'string',
              params: {
                parsedUrl: {
                  origin: 'http://localhost:5601',
                  pathname: '/app/kibana',
                  basePath: '',
                },
              },
            },
            params: {},
            label: 'Top 5 unusual terms in agent.name',
            aggType: 'significant_terms',
          },
        ],
      },
      radiusRatio: 50,
    },
    uiState: {
      vis: {
        defaultColors: {
          '0 - 7': 'rgb(247,251,255)',
          '7 - 13': 'rgb(219,233,246)',
          '13 - 20': 'rgb(187,214,235)',
          '20 - 26': 'rgb(137,190,220)',
          '26 - 33': 'rgb(83,158,205)',
          '33 - 39': 'rgb(42,123,186)',
          '39 - 45': 'rgb(11,85,159)',
        },
        legendOpen: true,
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
              negate: false,
              disabled: false,
              alias: null,
              type: 'exists',
              key: 'data.virustotal.positives',
              value: 'exists',
            },
            exists: {
              field: 'data.virustotal.positives',
            },
            $state: {
              store: 'appState',
            },
          },
          {
            meta: {
              index: 'wazuh-alerts',
              negate: true,
              disabled: false,
              alias: null,
              type: 'phrase',
              key: 'data.virustotal.positives',
              value: '0',
              params: {
                query: 0,
                type: 'phrase',
              },
            },
            query: {
              match: {
                'data.virustotal.positives': {
                  query: 0,
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
          params: {},
        },
        {
          id: '3',
          enabled: true,
          type: 'terms',
          schema: 'group',
          params: {
            field: 'agent.name',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
          },
        },
        {
          id: '2',
          enabled: true,
          type: 'date_histogram',
          schema: 'segment',
          params: {
            field: 'timestamp',
            timeRange: { from: 'now-7d', to: 'now' },
            useNormalizedEsInterval: true,
            scaleMetricValues: false,
            interval: 'auto',
            drop_partials: false,
            min_doc_count: 1,
            extended_bounds: {},
          },
        },
      ],
    },
  };
};

const getVisStateMaliciousFilesAlertsEvolution = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Overview-Virustotal-Malicious-Evolution',
    title: 'Malicious files alerts evolution',
    type: 'histogram',
    params: {
      type: 'histogram',
      grid: { categoryLines: false, style: { color: '#eee' } },
      categoryAxes: [
        {
          id: 'CategoryAxis-1',
          type: 'category',
          position: 'bottom',
          show: true,
          style: {},
          scale: { type: 'linear' },
          labels: { show: true, filter: true, truncate: 100 },
          title: {},
        },
      ],
      valueAxes: [
        {
          id: 'ValueAxis-1',
          name: 'LeftAxis-1',
          type: 'value',
          position: 'left',
          show: true,
          style: {},
          scale: { type: 'linear', mode: 'normal' },
          labels: { show: true, rotate: 0, filter: false, truncate: 100 },
          title: { text: 'Malicious' },
        },
      ],
      seriesParams: [
        {
          show: 'true',
          type: 'histogram',
          mode: 'stacked',
          data: { label: 'Malicious', id: '1' },
          valueAxis: 'ValueAxis-1',
          drawLinesBetweenPoints: true,
          showCircles: true,
        },
      ],
      addTooltip: true,
      addLegend: false,
      legendPosition: 'right',
      times: [],
      addTimeMarker: false,
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
              type: 'exists',
              key: 'data.virustotal.malicious',
              value: 'exists',
            },
            exists: {
              field: 'data.virustotal.malicious',
            },
            $state: {
              store: 'appState',
            },
          },
          {
            meta: {
              index: 'wazuh-alerts',
              negate: true,
              disabled: false,
              alias: null,
              type: 'phrase',
              key: 'data.virustotal.malicious',
              value: '0',
              params: {
                query: 0,
                type: 'phrase',
              },
            },
            query: {
              match: {
                'data.virustotal.malicious': {
                  query: 0,
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
          params: { customLabel: 'Malicious' },
        },
        {
          id: '2',
          enabled: true,
          type: 'date_histogram',
          schema: 'segment',
          params: {
            field: 'timestamp',
            interval: 'auto',
            customInterval: '2h',
            min_doc_count: 1,
            extended_bounds: {},
          },
        },
      ],
    },
  };
};

const getVisStateLastFiles = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Overview-Virustotal-Files-Table',
    title: 'Last files',
    type: 'table',
    params: {
      perPage: 10,
      showPartialRows: false,
      showMeticsAtAllLevels: false,
      sort: { columnIndex: 2, direction: 'desc' },
      showTotal: false,
      showToolbar: true,
      totalFunc: 'sum',
    },
    uiState: {
      vis: { params: { sort: { columnIndex: 2, direction: 'desc' } } },
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
          params: { customLabel: 'Count' },
        },
        {
          id: '4',
          enabled: true,
          type: 'terms',
          schema: 'bucket',
          params: {
            field: 'data.virustotal.source.file',
            size: 10,
            order: 'desc',
            orderBy: '1',
            customLabel: 'File',
          },
        },
        {
          id: '2',
          enabled: true,
          type: 'terms',
          schema: 'bucket',
          params: {
            field: 'data.virustotal.permalink',
            size: 1,
            order: 'desc',
            orderBy: '1',
            customLabel: 'Link',
          },
        },
      ],
    },
  };
};

/* Agent visualizations */

const getVisStateAgentLastScannedFiles = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Agents-Virustotal-Last-Files-Pie',
    title: 'Last scanned files',
    type: 'pie',
    params: {
      type: 'pie',
      addTooltip: true,
      addLegend: true,
      legendPosition: 'right',
      isDonut: true,
      labels: { show: false, values: true, last_level: true, truncate: 100 },
    },
    uiState: { vis: { legendOpen: true } },
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
          params: { customLabel: 'Files' },
        },
        {
          id: '2',
          enabled: true,
          type: 'terms',
          schema: 'segment',
          params: {
            field: 'data.virustotal.source.file',
            size: 5,
            order: 'desc',
            orderBy: '1',
          },
        },
      ],
    },
  };
};

const getVisStateAgentMaliciousFilesAlertsEvolution = (
  indexPatternId: string,
) => {
  return {
    id: 'Wazuh-App-Agents-Virustotal-Malicious-Evolution',
    title: 'Malicious files alerts Evolution',
    type: 'histogram',
    params: {
      type: 'histogram',
      grid: { categoryLines: false, style: { color: '#eee' } },
      categoryAxes: [
        {
          id: 'CategoryAxis-1',
          type: 'category',
          position: 'bottom',
          show: true,
          style: {},
          scale: { type: 'linear' },
          labels: { show: true, filter: true, truncate: 100 },
          title: {},
        },
      ],
      valueAxes: [
        {
          id: 'ValueAxis-1',
          name: 'LeftAxis-1',
          type: 'value',
          position: 'left',
          show: true,
          style: {},
          scale: { type: 'linear', mode: 'normal' },
          labels: { show: true, rotate: 0, filter: false, truncate: 100 },
          title: { text: 'Malicious' },
        },
      ],
      seriesParams: [
        {
          show: 'true',
          type: 'histogram',
          mode: 'stacked',
          data: { label: 'Malicious', id: '1' },
          valueAxis: 'ValueAxis-1',
          drawLinesBetweenPoints: true,
          showCircles: true,
        },
      ],
      addTooltip: true,
      addLegend: false,
      legendPosition: 'right',
      times: [],
      addTimeMarker: false,
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
              type: 'exists',
              key: 'data.virustotal.positives',
              value: 'exists',
            },
            exists: {
              field: 'data.virustotal.positives',
            },
            $state: {
              store: 'appState',
            },
          },
          {
            meta: {
              index: 'wazuh-alerts',
              negate: true,
              disabled: false,
              alias: null,
              type: 'phrase',
              key: 'data.virustotal.positives',
              value: '0',
              params: {
                query: 0,
                type: 'phrase',
              },
            },
            query: {
              match: {
                'data.virustotal.positives': {
                  query: 0,
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
          params: { customLabel: 'Malicious' },
        },
        {
          id: '2',
          enabled: true,
          type: 'date_histogram',
          schema: 'segment',
          params: {
            field: 'timestamp',
            interval: 'auto',
            customInterval: '2h',
            min_doc_count: 1,
            extended_bounds: {},
          },
        },
      ],
    },
  };
};

const getVisStateAgentLastFiles = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Agents-Virustotal-Files-Table',
    title: 'Last files',
    type: 'table',
    params: {
      perPage: 10,
      showPartialRows: false,
      showMeticsAtAllLevels: false,
      sort: { columnIndex: 2, direction: 'desc' },
      showTotal: false,
      showToolbar: true,
      totalFunc: 'sum',
    },
    uiState: {
      vis: { params: { sort: { columnIndex: 2, direction: 'desc' } } },
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
          params: { customLabel: 'Count' },
        },
        {
          id: '4',
          enabled: true,
          type: 'terms',
          schema: 'bucket',
          params: {
            field: 'data.virustotal.source.file',
            size: 10,
            order: 'desc',
            orderBy: '1',
            customLabel: 'File',
          },
        },
        {
          id: '2',
          enabled: true,
          type: 'terms',
          schema: 'bucket',
          params: {
            field: 'data.virustotal.permalink',
            size: 1,
            order: 'desc',
            orderBy: '1',
            missingBucket: true,
            missingBucketLabel: '-',
            customLabel: 'Link',
          },
        },
      ],
    },
  };
};

/* Definitiion of panels */

export const getDashboardPanels = (
  indexPatternId: string,
  pinnedAgent?: boolean,
): {
  [panelId: string]: DashboardPanelState<
    EmbeddableInput & { [k: string]: unknown }
  >;
} => {
  const pinnedAgentPanels = {
    '6': {
      gridData: {
        w: 12,
        h: 9,
        x: 0,
        y: 0,
        i: '6',
      },
      type: 'visualization',
      explicitInput: {
        id: '6',
        savedVis: getVisStateAgentLastScannedFiles(indexPatternId),
      },
    },
    '7': {
      gridData: {
        w: 36,
        h: 9,
        x: 12,
        y: 0,
        i: '7',
      },
      type: 'visualization',
      explicitInput: {
        id: '7',
        savedVis: getVisStateAgentMaliciousFilesAlertsEvolution(indexPatternId),
      },
    },
    '8': {
      gridData: {
        w: 48,
        h: 20,
        x: 0,
        y: 9,
        i: '8',
      },
      type: 'visualization',
      explicitInput: {
        id: '8',
        savedVis: getVisStateAgentLastFiles(indexPatternId),
      },
    },
  };

  const panels = {
    '1': {
      gridData: {
        w: 24,
        h: 13,
        x: 0,
        y: 0,
        i: '1',
      },
      type: 'visualization',
      explicitInput: {
        id: '1',
        savedVis: getVisStateTop5UniqueMaliciousFilesPerAgent(indexPatternId),
      },
    },
    '2': {
      gridData: {
        w: 24,
        h: 13,
        x: 28,
        y: 0,
        i: '2',
      },
      type: 'visualization',
      explicitInput: {
        id: '2',
        savedVis: getVisStateLastScannedFiles(indexPatternId),
      },
    },
    '3': {
      gridData: {
        w: 48,
        h: 20,
        x: 0,
        y: 13,
        i: '3',
      },
      type: 'visualization',
      explicitInput: {
        id: '3',
        savedVis: getVisStateAlertsEvolutionByAgents(indexPatternId),
      },
    },
    '4': {
      gridData: {
        w: 48,
        h: 9,
        x: 0,
        y: 23,
        i: '4',
      },
      type: 'visualization',
      explicitInput: {
        id: '4',
        savedVis: getVisStateMaliciousFilesAlertsEvolution(indexPatternId),
      },
    },
    '5': {
      gridData: {
        w: 48,
        h: 20,
        x: 0,
        y: 32,
        i: '5',
      },
      type: 'visualization',
      explicitInput: {
        id: '5',
        savedVis: getVisStateLastFiles(indexPatternId),
      },
    },
  };

  return pinnedAgent ? pinnedAgentPanels : panels;
};
