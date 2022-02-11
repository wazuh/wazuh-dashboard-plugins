/*
 * Wazuh app - Module for Overview/VirusTotal visualizations
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export default [
  {
    _id: 'Wazuh-App-Overview-Virustotal-Last-Files-Pie',
    _type: 'visualization',
    _source: {
      title: 'Last files',
      visState: JSON.stringify({
        title: 'Last files',
        type: 'pie',
        params: {
          type: 'pie',
          addTooltip: true,
          addLegend: true,
          legendPosition: 'right',
          isDonut: true,
          labels: { show: false, values: true, last_level: true, truncate: 100 },
        },
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
            params: { field: 'data.virustotal.source.file', size: 5, order: 'desc', orderBy: '1' },
          },
        ],
      }),
      uiStateJSON: JSON.stringify({ vis: { legendOpen: true } }),
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON: JSON.stringify({
          index: 'wazuh-alerts',
          filter: [],
          query: { query: '', language: 'lucene' },
        }),
      },
    },
  },
  {
    _id: 'Wazuh-App-Overview-Virustotal-Files-Table',
    _type: 'visualization',
    _source: {
      title: 'Files',
      visState: JSON.stringify({
        title: 'Files',
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
      }),
      uiStateJSON: JSON.stringify({
        vis: { params: { sort: { columnIndex: 2, direction: 'desc' } } },
      }),
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","filter":[],"query":{"query":"","language":"lucene"}}',
      },
    },
  },
  {
    _id: 'Wazuh-App-Overview-Virustotal-Total-Malicious',
    _type: 'visualization',
    _source: {
      title: 'Total Malicious',
      visState: JSON.stringify({
        title: 'Total Malicious',
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
            colorsRange: [{ from: 0, to: 10000 }],
            labels: { show: true },
            invertColors: false,
            style: { bgFill: '#000', bgColor: false, labelColor: false, subText: '', fontSize: 20 },
          },
        },
        aggs: [
          {
            id: '1',
            enabled: true,
            type: 'count',
            schema: 'metric',
            params: { customLabel: 'Total malicious files' },
          },
        ],
      }),
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON: JSON.stringify({
          index: 'wazuh-alerts',
          filter: [
            {
              meta: {
                index: 'wazuh-alerts',
                negate: false,
                disabled: false,
                alias: null,
                type: 'phrase',
                key: 'data.virustotal.malicious',
                value: '1',
                params: {
                  query: '1',
                  type: 'phrase',
                },
              },
              query: {
                match: {
                  'data.virustotal.malicious': {
                    query: '1',
                    type: 'phrase',
                  },
                },
              },
              $state: {
                store: 'appState',
              },
            },
          ],
          query: { query: '', language: 'lucene' },
        }),
      },
    },
  },
  {
    _id: 'Wazuh-App-Overview-Virustotal-Total-Positives',
    _type: 'visualization',
    _source: {
      title: 'Total Positives',
      visState: JSON.stringify({
        title: 'Total Positives',
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
            colorsRange: [{ from: 0, to: 10000 }],
            labels: { show: true },
            invertColors: false,
            style: { bgFill: '#000', bgColor: false, labelColor: false, subText: '', fontSize: 20 },
          },
        },
        aggs: [
          {
            id: '1',
            enabled: true,
            type: 'count',
            schema: 'metric',
            params: { customLabel: 'Total positive files' },
          },
        ],
      }),
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON: JSON.stringify({
          index: 'wazuh-alerts',
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
          query: { query: '', language: 'lucene' },
        }),
      },
    },
  },
  {
    _id: 'Wazuh-App-Overview-Virustotal-Malicious-Evolution',
    _type: 'visualization',
    _source: {
      title: 'Malicious Evolution',
      visState: JSON.stringify({
        title: 'Malicious Evolution',
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
      }),
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON: JSON.stringify({
          index: 'wazuh-alerts',
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
          query: { query: '', language: 'lucene' },
        }),
      },
    },
  },
  {
    _id: 'Wazuh-App-Overview-Virustotal-Total',
    _type: 'visualization',
    _source: {
      title: 'Total',
      visState: JSON.stringify({
        title: 'Total',
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
            colorsRange: [{ from: 0, to: 10000 }],
            labels: { show: true },
            invertColors: false,
            style: { bgFill: '#000', bgColor: false, labelColor: false, subText: '', fontSize: 20 },
          },
        },
        aggs: [
          {
            id: '1',
            enabled: true,
            type: 'count',
            schema: 'metric',
            params: { customLabel: 'Total scans' },
          },
        ],
      }),
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON: JSON.stringify({
          index: 'wazuh-alerts',
          filter: [
            {
              meta: {
                index: 'wazuh-alerts',
                negate: false,
                disabled: false,
                alias: null,
                type: 'exists',
                key: 'data.virustotal',
                value: 'exists',
              },
              exists: {
                field: 'data.virustotal',
              },
              $state: {
                store: 'appState',
              },
            },
          ],
          query: { query: '', language: 'lucene' },
        }),
      },
    },
  },
  {
    _id: 'Wazuh-App-Overview-Virustotal-Malicious-Per-Agent-Table',
    _type: 'visualization',
    _source: {
      title: 'Malicious Per Agent Table',
      visState: JSON.stringify({
        title: 'Malicious Per Agent Table',
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
        aggs: [
          {
            id: '1',
            enabled: true,
            type: 'cardinality',
            schema: 'metric',
            params: {
              field: 'data.virustotal.source.md5',
              customLabel: 'Malicious detected files',
            },
          },
          {
            id: '2',
            enabled: true,
            type: 'terms',
            schema: 'bucket',
            params: {
              field: 'agent.name',
              size: 16,
              order: 'desc',
              orderBy: '1',
              customLabel: 'Agent',
            },
          },
        ],
      }),
      uiStateJSON: JSON.stringify({
        vis: { params: { sort: { columnIndex: 2, direction: 'desc' } } },
      }),
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON: JSON.stringify({
          index: 'wazuh-alerts',
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
          query: { query: '', language: 'lucene' },
        }),
      },
    },
  },
  {
    _id: 'Wazuh-App-Overview-Virustotal-Malicious-Per-Agent',
    _type: 'visualization',
    _source: {
      title: 'Top 5 agents with unique malicious files',
      visState: JSON.stringify({
        title: 'Top 5 agents with unique malicious files',
        type: 'pie',
        params: {
          type: 'pie',
          addTooltip: true,
          addLegend: true,
          legendPosition: 'right',
          isDonut: true,
          labels: { show: false, values: true, last_level: true, truncate: 100 },
        },
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
            params: { field: 'agent.name', size: 5, order: 'desc', orderBy: '1' },
          },
        ],
      }),
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON: JSON.stringify({
          index: 'wazuh-alerts',
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
          query: { query: '', language: 'lucene' },
        }),
      },
    },
  },
  {
    _id: 'Wazuh-App-Overview-Virustotal-Alerts-Evolution',
    _type: 'visualization',
    _source: {
      title: 'Positives Heatmap',
      visState: JSON.stringify({
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
          thresholdLine: { show: false, value: 10, width: 1, style: 'full', color: '#E7664C' },
          dimensions: {
            x: {
              accessor: 0,
              format: { id: 'date', params: { pattern: 'YYYY-MM-DD HH:mm' } },
              params: {
                date: true,
                interval: 'PT3H',
                intervalESValue: 3,
                intervalESUnit: 'h',
                format: 'YYYY-MM-DD HH:mm',
                bounds: { min: '2020-04-17T12:11:35.943Z', max: '2020-04-24T12:11:35.944Z' },
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
        aggs: [
          { id: '1', enabled: true, type: 'count', schema: 'metric', params: {} },
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
        ],
      }),
      uiStateJSON: JSON.stringify({
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
      }),
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON: JSON.stringify({
          index: 'wazuh-alerts',
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
          query: { query: '', language: 'lucene' },
        }),
      },
    },
  },
  {
    _id: 'Wazuh-App-Overview-Virustotal-Alerts-summary',
    _type: 'visualization',
    _source: {
      title: 'Alerts summary',
      visState: JSON.stringify({
        title: 'Alerts summary',
        type: 'table',
        params: {
          perPage: 10,
          showPartialRows: false,
          showMeticsAtAllLevels: false,
          sort: { columnIndex: 3, direction: 'desc' },
          showTotal: false,
          showToolbar: true,
          totalFunc: 'sum',
        },
        aggs: [
          { id: '1', enabled: true, type: 'count', schema: 'metric', params: {} },
          {
            id: '2',
            enabled: true,
            type: 'terms',
            schema: 'bucket',
            params: {
              field: 'rule.id',
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              size: 1000,
              order: 'desc',
              orderBy: '1',
              customLabel: 'Rule ID',
            },
          },
          {
            id: '3',
            enabled: true,
            type: 'terms',
            schema: 'bucket',
            params: {
              field: 'rule.description',
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              size: 20,
              order: 'desc',
              orderBy: '1',
              customLabel: 'Description',
            },
          },
          {
            id: '4',
            enabled: true,
            type: 'terms',
            schema: 'bucket',
            params: {
              field: 'rule.level',
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              size: 12,
              order: 'desc',
              orderBy: '1',
              customLabel: 'Level',
            },
          },
        ],
      }),
      uiStateJSON: JSON.stringify({
        vis: { params: { sort: { columnIndex: 3, direction: 'desc' } } },
      }),
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON: JSON.stringify({
          index: 'wazuh-alerts',
          filter: [],
          query: { query: '', language: 'lucene' },
        }),
      },
    },
  },
];
