/*
 * Wazuh app - Module for Agents/OSCAP visualizations
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
    _id: 'Wazuh-App-Agents-OSCAP-Higher-score-metric',
    _source: {
      title: 'Higher score metric',
      visState: JSON.stringify({
        title: 'Higher score metric',
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
            type: 'max',
            schema: 'metric',
            params: { field: 'data.oscap.scan.score', customLabel: 'Higher score' },
          },
        ],
      }),
      uiStateJSON: '{"vis":{"defaultColors":{"0 - 100":"rgb(0,104,55)"}}}',
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
    _id: 'Wazuh-App-Agents-OSCAP-Lower-score-metric',
    _source: {
      title: 'Lower score metric',
      visState: JSON.stringify({
        title: 'Lower score metric',
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
            type: 'min',
            schema: 'metric',
            params: { field: 'data.oscap.scan.score', customLabel: 'Lower score' },
          },
        ],
      }),
      uiStateJSON: JSON.stringify({ vis: { defaultColors: { '0 - 100': 'rgb(0,104,55)' } } }),
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
    _id: 'Wazuh-App-Agents-OSCAP-Last-score',
    _source: {
      title: 'Last score',
      visState: JSON.stringify({
        title: 'Last score',
        type: 'table',
        params: {
          perPage: 10,
          showPartialRows: false,
          showMeticsAtAllLevels: false,
          sort: { columnIndex: null, direction: null },
          showTotal: false,
          showToolbar: true,
          totalFunc: 'sum',
        },
        aggs: [
          { id: '1', enabled: true, type: 'max', schema: 'metric', params: { field: 'timestamp' } },
          {
            id: '2',
            enabled: true,
            type: 'terms',
            schema: 'bucket',
            params: { field: 'data.oscap.scan.score', size: 1, order: 'desc', orderBy: '1' },
          },
        ],
      }),
      uiStateJSON: JSON.stringify({
        vis: { params: { sort: { columnIndex: null, direction: null } } },
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
    _type: 'visualization',
  },
  {
    _id: 'Wazuh-App-Agents-OSCAP-Last-scan-profile',
    _source: {
      title: 'Last scan profile',
      visState: JSON.stringify({
        title: 'Last scan profile',
        type: 'table',
        params: {
          perPage: 10,
          showPartialRows: false,
          showMeticsAtAllLevels: false,
          sort: { columnIndex: null, direction: null },
          showTotal: false,
          showToolbar: true,
          totalFunc: 'sum',
        },
        aggs: [
          { id: '1', enabled: true, type: 'max', schema: 'metric', params: { field: 'timestamp' } },
          {
            id: '2',
            enabled: true,
            type: 'terms',
            schema: 'bucket',
            params: {
              field: 'data.oscap.scan.profile.title',
              size: 1,
              order: 'desc',
              orderBy: '1',
            },
          },
        ],
      }),
      uiStateJSON: JSON.stringify({
        vis: { params: { sort: { columnIndex: null, direction: null } } },
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
                type: 'phrase',
                key: 'data.oscap.check.result',
                value: 'fail',
                params: {
                  query: 'fail',
                  type: 'phrase',
                },
              },
              query: {
                match: {
                  'data.oscap.check.result': {
                    query: 'fail',
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
    _id: 'Wazuh-App-Agents-OSCAP-Scans',
    _source: {
      title: 'Scans',
      visState: JSON.stringify({
        title: 'Scans',
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
            params: { field: 'data.oscap.scan.id', size: 5, order: 'desc', orderBy: '1' },
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
    _id: 'Wazuh-App-Agents-OSCAP-Profiles',
    _source: {
      title: 'Profiles',
      visState: JSON.stringify({
        title: 'Profiles',
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
            params: {
              field: 'data.oscap.scan.profile.title',
              size: 5,
              order: 'desc',
              orderBy: '1',
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
                type: 'phrase',
                key: 'data.oscap.check.result',
                value: 'fail',
                params: {
                  query: 'fail',
                  type: 'phrase',
                },
              },
              query: {
                match: {
                  'data.oscap.check.result': {
                    query: 'fail',
                    type: 'phrase',
                  },
                },
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
                key: 'rule.groups',
                value: 'syslog',
                params: {
                  query: 'syslog',
                  type: 'phrase',
                },
              },
              query: {
                match: {
                  'rule.groups': {
                    query: 'syslog',
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
    _id: 'Wazuh-App-Agents-OSCAP-Content',
    _source: {
      title: 'Content',
      visState: JSON.stringify({
        title: 'Content',
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
            params: { field: 'data.oscap.scan.content', size: 5, order: 'desc', orderBy: '1' },
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
                key: 'data.oscap.check.result',
                value: 'fail',
                params: {
                  query: 'fail',
                  type: 'phrase',
                },
              },
              query: {
                match: {
                  'data.oscap.check.result': {
                    query: 'fail',
                    type: 'phrase',
                  },
                },
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
                key: 'rule.groups',
                value: 'syslog',
                params: {
                  query: 'syslog',
                  type: 'phrase',
                },
              },
              query: {
                match: {
                  'rule.groups': {
                    query: 'syslog',
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
    _id: 'Wazuh-App-Agents-OSCAP-Severity',
    _source: {
      title: 'Severity',
      visState: JSON.stringify({
        title: 'Severity',
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
            params: { field: 'data.oscap.check.severity', size: 5, order: 'desc', orderBy: '1' },
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
                key: 'data.oscap.check.result',
                value: 'fail',
                params: {
                  query: 'fail',
                  type: 'phrase',
                },
              },
              query: {
                match: {
                  'data.oscap.check.result': {
                    query: 'fail',
                    type: 'phrase',
                  },
                },
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
                key: 'rule.groups',
                value: 'syslog',
                params: {
                  query: 'syslog',
                  type: 'phrase',
                },
              },
              query: {
                match: {
                  'rule.groups': {
                    query: 'syslog',
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
    _id: 'Wazuh-App-Agents-OSCAP-Daily-scans-evolution',
    _source: {
      title: 'Daily scans evolution',
      visState: JSON.stringify({
        title: 'Daily scans evolution',
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
              title: { text: 'Count' },
            },
          ],
          seriesParams: [
            {
              show: 'true',
              type: 'histogram',
              mode: 'stacked',
              data: { label: 'Count', id: '1' },
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
          { id: '1', enabled: true, type: 'count', schema: 'metric', params: {} },
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
              customLabel: 'Daily scans',
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
                type: 'phrase',
                key: 'data.oscap.check.result',
                value: 'fail',
                params: {
                  query: 'fail',
                  type: 'phrase',
                },
              },
              query: {
                match: {
                  'data.oscap.check.result': {
                    query: 'fail',
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
    _id: 'Wazuh-App-Agents-OSCAP-Top-5-Alerts',
    _source: {
      title: 'Top 5 Alerts',
      visState: JSON.stringify({
        title: 'Top 5 Alerts',
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
            params: { field: 'data.oscap.check.title', size: 5, order: 'desc', orderBy: '1' },
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
                key: 'data.oscap.check.result',
                value: 'fail',
                params: {
                  query: 'fail',
                  type: 'phrase',
                },
              },
              query: {
                match: {
                  'data.oscap.check.result': {
                    query: 'fail',
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
    _id: 'Wazuh-App-Agents-OSCAP-Top-5-High-risk-alerts',
    _source: {
      title: 'Top 5 High risk alerts',
      visState: JSON.stringify({
        title: 'Top 5 High risk alerts',
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
            params: { field: 'data.oscap.check.title', size: 5, order: 'desc', orderBy: '1' },
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
                key: 'data.oscap.check.result',
                value: 'fail',
                params: {
                  query: 'fail',
                  type: 'phrase',
                },
              },
              query: {
                match: {
                  'data.oscap.check.result': {
                    query: 'fail',
                    type: 'phrase',
                  },
                },
              },
              $state: {
                store: 'appState',
              },
            },
            {
              meta: {
                index: 'wazuh-alerts',
                negate: false,
                disabled: false,
                alias: null,
                type: 'phrase',
                key: 'data.oscap.check.severity',
                value: 'high',
                params: {
                  query: 'high',
                  type: 'phrase',
                },
              },
              query: {
                match: {
                  'data.oscap.check.severity': {
                    query: 'high',
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
    _id: 'Wazuh-App-Agents-OSCAP-Top-alert',
    _source: {
      title: 'Top alert',
      visState: JSON.stringify({
        title: 'Top alert',
        type: 'table',
        params: {
          perPage: 10,
          showPartialRows: false,
          showMeticsAtAllLevels: false,
          sort: { columnIndex: null, direction: null },
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
            params: { field: 'data.oscap.check.title', size: 1, order: 'desc', orderBy: '1' },
          },
        ],
      }),
      uiStateJSON: JSON.stringify({
        vis: { params: { sort: { columnIndex: null, direction: null } } },
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
                type: 'phrase',
                key: 'data.oscap.check.result',
                value: 'fail',
                params: {
                  query: 'fail',
                  type: 'phrase',
                },
              },
              query: {
                match: {
                  'data.oscap.check.result': {
                    query: 'fail',
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
    _id: 'Wazuh-App-Agents-OSCAP-Last-alerts',
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
          sort: { columnIndex: 2, direction: 'desc' },
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
              field: 'data.oscap.check.title',
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              size: 50,
              order: 'desc',
              orderBy: '1',
              customLabel: 'Title',
            },
          },
          {
            id: '4',
            enabled: true,
            type: 'terms',
            schema: 'bucket',
            params: {
              field: 'data.oscap.scan.profile.title',
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              size: 5,
              order: 'desc',
              orderBy: '1',
              customLabel: 'Profile',
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
          filter: [],
          query: { query: '', language: 'lucene' },
        }),
      },
    },
  },
];
