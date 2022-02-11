/*
 * Wazuh app - Module for Agents/Audit visualizations
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
    _id: 'Wazuh-App-Agents-Audit-New-files-metric',
    _source: {
      title: 'New files metric',
      visState: JSON.stringify({
        title: 'New files metric',
        type: 'metric',
        params: {
          addTooltip: true,
          addLegend: false,
          type: 'gauge',
          gauge: {
            verticalSplit: false,
            autoExtend: false,
            percentageMode: false,
            gaugeType: 'Metric',
            gaugeStyle: 'Full',
            backStyle: 'Full',
            orientation: 'vertical',
            colorSchema: 'Green to Red',
            gaugeColorMode: 'None',
            useRange: false,
            colorsRange: [{ from: 0, to: 100 }],
            invertColors: false,
            labels: { show: true, color: 'black' },
            scale: { show: false, labels: false, color: '#333', width: 2 },
            type: 'simple',
            style: { fontSize: 20, bgColor: false, labelColor: false, subText: '' },
          },
        },
        aggs: [
          {
            id: '1',
            enabled: true,
            type: 'count',
            schema: 'metric',
            params: { customLabel: 'New files' },
          },
        ],
      }),
      uiStateJSON: JSON.stringify({ vis: { defaultColors: { '0 - 100': 'rgb(0,104,55)' } } }),
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
                key: 'rule.id',
                value: '80790',
                params: {
                  query: '80790',
                  type: 'phrase',
                },
              },
              query: {
                match: {
                  'rule.id': {
                    query: '80790',
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
    _type: 'visualization',
  },
  {
    _id: 'Wazuh-App-Agents-Audit-Read-files-metric',
    _source: {
      title: 'Read files metric',
      visState: JSON.stringify({
        title: 'Read files metric',
        type: 'metric',
        params: {
          addTooltip: true,
          addLegend: false,
          type: 'gauge',
          gauge: {
            verticalSplit: false,
            autoExtend: false,
            percentageMode: false,
            gaugeType: 'Metric',
            gaugeStyle: 'Full',
            backStyle: 'Full',
            orientation: 'vertical',
            colorSchema: 'Green to Red',
            gaugeColorMode: 'None',
            useRange: false,
            colorsRange: [{ from: 0, to: 100 }],
            invertColors: false,
            labels: { show: true, color: 'black' },
            scale: { show: false, labels: false, color: '#333', width: 2 },
            type: 'simple',
            style: { fontSize: 20, bgColor: false, labelColor: false, subText: '' },
          },
        },
        aggs: [
          {
            id: '1',
            enabled: true,
            type: 'count',
            schema: 'metric',
            params: { customLabel: 'Read files' },
          },
        ],
      }),
      uiStateJSON: JSON.stringify({ vis: { defaultColors: { '0 - 100': 'rgb(0,104,55)' } } }),
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
                key: 'rule.id',
                value: '80784',
                params: {
                  query: '80784',
                  type: 'phrase',
                },
              },
              query: {
                match: {
                  'rule.id': {
                    query: '80784',
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
    _type: 'visualization',
  },
  {
    _id: 'Wazuh-App-Agents-Audit-Modified-files-metric',
    _source: {
      title: 'Modified files metric',
      visState: JSON.stringify({
        title: 'Modified files metric',
        type: 'metric',
        params: {
          addTooltip: true,
          addLegend: false,
          type: 'gauge',
          gauge: {
            verticalSplit: false,
            autoExtend: false,
            percentageMode: false,
            gaugeType: 'Metric',
            gaugeStyle: 'Full',
            backStyle: 'Full',
            orientation: 'vertical',
            colorSchema: 'Green to Red',
            gaugeColorMode: 'None',
            useRange: false,
            colorsRange: [{ from: 0, to: 100 }],
            invertColors: false,
            labels: { show: true, color: 'black' },
            scale: { show: false, labels: false, color: '#333', width: 2 },
            type: 'simple',
            style: { fontSize: 20, bgColor: false, labelColor: false, subText: '' },
          },
        },
        aggs: [
          {
            id: '1',
            enabled: true,
            type: 'count',
            schema: 'metric',
            params: { customLabel: 'Modified files' },
          },
        ],
      }),
      uiStateJSON: JSON.stringify({ vis: { defaultColors: { '0 - 100': 'rgb(0,104,55)' } } }),
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON: JSON.stringify({
          index: 'wazuh-alerts',
          filter: [
            {
              meta: {
                index: 'wazuh-alerts',
                type: 'phrases',
                key: 'rule.id',
                value: '80781, 80787',
                params: ['80781', '80787'],
                negate: false,
                disabled: false,
                alias: null,
              },
              query: {
                bool: {
                  should: [
                    {
                      match_phrase: {
                        'rule.id': '80781',
                      },
                    },
                    {
                      match_phrase: {
                        'rule.id': '80787',
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
          query: { query: '', language: 'lucene' },
        }),
      },
    },
    _type: 'visualization',
  },
  {
    _id: 'Wazuh-App-Agents-Audit-Removed-files-metric',
    _source: {
      title: 'Removed files metric',
      visState: JSON.stringify({
        title: 'Removed files metric',
        type: 'metric',
        params: {
          addTooltip: true,
          addLegend: false,
          type: 'gauge',
          gauge: {
            verticalSplit: false,
            autoExtend: false,
            percentageMode: false,
            gaugeType: 'Metric',
            gaugeStyle: 'Full',
            backStyle: 'Full',
            orientation: 'vertical',
            colorSchema: 'Green to Red',
            gaugeColorMode: 'None',
            useRange: false,
            colorsRange: [{ from: 0, to: 100 }],
            invertColors: false,
            labels: { show: true, color: 'black' },
            scale: { show: false, labels: false, color: '#333', width: 2 },
            type: 'simple',
            style: { fontSize: 20, bgColor: false, labelColor: false, subText: '' },
          },
        },
        aggs: [
          {
            id: '1',
            enabled: true,
            type: 'count',
            schema: 'metric',
            params: { customLabel: 'Removed files' },
          },
        ],
      }),
      uiStateJSON: JSON.stringify({ vis: { defaultColors: { '0 - 100': 'rgb(0,104,55)' } } }),
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
                key: 'rule.id',
                value: '80791',
                params: {
                  query: '80791',
                  type: 'phrase',
                },
              },
              query: {
                match: {
                  'rule.id': {
                    query: '80791',
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
    _type: 'visualization',
  },
  {
    _id: 'Wazuh-App-Agents-Audit-Groups',
    _source: {
      title: 'Groups',
      visState: JSON.stringify({
        title: 'Groups',
        type: 'pie',
        params: {
          type: 'pie',
          addTooltip: true,
          addLegend: true,
          legendPosition: 'right',
          isDonut: true,
        },
        aggs: [
          { id: '1', enabled: true, type: 'count', schema: 'metric', params: {} },
          {
            id: '2',
            enabled: true,
            type: 'terms',
            schema: 'segment',
            params: { field: 'rule.groups', size: 5, order: 'desc', orderBy: '1' },
          },
        ],
      }),
      uiStateJSON: '{}',
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
    _type: 'visualization',
  },
  {
    _id: 'Wazuh-App-Agents-Audit-Files',
    _source: {
      title: 'Files',
      visState: JSON.stringify({
        title: 'Files',
        type: 'pie',
        params: {
          type: 'pie',
          addTooltip: true,
          addLegend: true,
          legendPosition: 'right',
          isDonut: true,
        },
        aggs: [
          { id: '1', enabled: true, type: 'count', schema: 'metric', params: {} },
          {
            id: '2',
            enabled: true,
            type: 'terms',
            schema: 'segment',
            params: { field: 'data.audit.file.name', size: 5, order: 'desc', orderBy: '1' },
          },
        ],
      }),
      uiStateJSON: '{}',
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
    _type: 'visualization',
  },
  {
    _id: 'Wazuh-App-Agents-Audit-Alerts-over-time',
    _source: {
      title: 'Alerts over time',
      visState: JSON.stringify({
        title: 'Alerts over time',
        type: 'area',
        params: {
          type: 'area',
          grid: { categoryLines: true, style: { color: '#eee' }, valueAxis: 'ValueAxis-1' },
          categoryAxes: [
            {
              id: 'CategoryAxis-1',
              type: 'category',
              position: 'bottom',
              show: true,
              style: {},
              scale: { type: 'linear' },
              labels: { show: true, truncate: 100 },
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
              show: 'true',
              type: 'area',
              mode: 'stacked',
              data: { label: 'Count', id: '1' },
              drawLinesBetweenPoints: true,
              showCircles: true,
              interpolate: 'cardinal',
              valueAxis: 'ValueAxis-1',
            },
          ],
          addTooltip: true,
          addLegend: true,
          legendPosition: 'right',
          times: [],
          addTimeMarker: false,
        },
        aggs: [
          { id: '1', enabled: true, type: 'count', schema: 'metric', params: {} },
          {
            id: '3',
            enabled: true,
            type: 'terms',
            schema: 'group',
            params: {
              field: 'rule.description',
              size: 5,
              order: 'desc',
              orderBy: '1',
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
              timeRange: { from: 'now-1h', to: 'now', mode: 'quick' },
              useNormalizedEsInterval: true,
              interval: 'auto',
              time_zone: 'Europe/Berlin',
              drop_partials: false,
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
          filter: [],
          query: { query: '', language: 'lucene' },
        }),
      },
    },
    _type: 'visualization',
  },
  {
    _id: 'Wazuh-App-Agents-Audit-Commands',
    _source: {
      title: 'Commands',
      visState: JSON.stringify({
        title: 'Commands',
        type: 'pie',
        params: {
          type: 'pie',
          addTooltip: true,
          addLegend: true,
          legendPosition: 'right',
          isDonut: true,
        },
        aggs: [
          { id: '1', enabled: true, type: 'count', schema: 'metric', params: {} },
          {
            id: '2',
            enabled: true,
            type: 'terms',
            schema: 'segment',
            params: { field: 'data.audit.command', size: 5, order: 'desc', orderBy: '1' },
          },
        ],
      }),
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","filter":[],"query":{"query":"","language":"lucene"}}',
      },
    },
    _type: 'visualization',
  },
  {
    _id: 'Wazuh-App-Agents-Audit-Last-alerts',
    _type: 'visualization',
    _source: {
      title: 'Last alerts',
      visState: JSON.stringify({
        title: 'Last alerts',
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
              size: 50,
              order: 'desc',
              orderBy: '1',
              customLabel: 'Event',
            },
          },
          {
            id: '4',
            enabled: true,
            type: 'terms',
            schema: 'bucket',
            params: {
              field: 'data.audit.exe',
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              size: 10,
              order: 'desc',
              orderBy: '1',
              customLabel: 'Command',
            },
          },
          {
            id: '5',
            enabled: true,
            type: 'terms',
            schema: 'bucket',
            params: {
              field: 'data.audit.type',
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              size: 5,
              order: 'desc',
              orderBy: '1',
              customLabel: 'Type',
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
