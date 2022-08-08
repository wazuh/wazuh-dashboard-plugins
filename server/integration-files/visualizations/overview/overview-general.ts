/*
 * Wazuh app - Module for Overview/General visualizations
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { UI_COLOR_AGENT_STATUS } from "../../../../common/constants";

export default [
  {
    _id: 'Wazuh-App-Overview-General-Agents-status',
    _source: {
      title: 'Agents status',
      visState: JSON.stringify({
        title: 'Agents Status',
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
              show: true,
              mode: 'normal',
              type: 'line',
              drawLinesBetweenPoints: true,
              showCircles: true,
              interpolate: 'cardinal',
              lineWidth: 3.5,
              data: { id: '4', label: 'Unique count of id' },
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
          {
            id: '2',
            enabled: true,
            type: 'date_histogram',
            interval: '1ms',
            schema: 'segment',
            params: {
              field: 'timestamp',
              interval: '1ms',
              customInterval: '2h',
              min_doc_count: 1,
              extended_bounds: {},
            },
          },
          {
            id: '3',
            enabled: true,
            type: 'terms',
            schema: 'group',
            params: { field: 'status', size: 5, order: 'desc', orderBy: '_term' },
          },
          {
            id: '4',
            enabled: true,
            type: 'cardinality',
            schema: 'metric',
            params: { field: 'id' },
          },
        ],
      }),
      uiStateJSON: JSON.stringify({
        vis: { colors: { active: UI_COLOR_AGENT_STATUS.active, disconnected: UI_COLOR_AGENT_STATUS.disconnected, pending: UI_COLOR_AGENT_STATUS.pending, never_connected: UI_COLOR_AGENT_STATUS.never_connected } },
      }),
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON: JSON.stringify({
          index: 'wazuh-monitoring',
          filter: [],
          query: { query: '', language: 'lucene' },
        }),
      },
    },
    _type: 'visualization',
  },
  {
    _id: 'Wazuh-App-Overview-General-Metric-alerts',
    _source: {
      title: 'Metric alerts',
      visState: JSON.stringify({
        title: 'Metric Alerts',
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
            params: { customLabel: 'Alerts' },
          },
        ],
      }),
      uiStateJSON: JSON.stringify({ vis: { defaultColors: { '0 - 100': 'rgb(0,104,55)' } } }),
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
    _id: 'Wazuh-App-Overview-General-Level-12-alerts',
    _source: {
      title: 'Level 12 alerts',
      visState: JSON.stringify({
        title: 'Count Level 12 Alerts',
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
            params: { customLabel: 'Level 12 or above alerts' },
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
          query: { query: '', language: 'lucene' },
        }),
      },
    },
    _type: 'visualization',
  },
  {
    _id: 'Wazuh-App-Overview-General-Authentication-failure',
    _source: {
      title: 'Authentication failure',
      visState: JSON.stringify({
        title: 'Count Authentication Failure',
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
            params: { customLabel: 'Authentication failure' },
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
                key: 'rule.groups',
                value: 'win_authentication_failed, authentication_failed, authentication_failures',
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
          query: { query: '', language: 'lucene' },
        }),
      },
    },
    _type: 'visualization',
  },
  {
    _id: 'Wazuh-App-Overview-General-Authentication-success',
    _source: {
      title: 'Authentication success',
      visState: JSON.stringify({
        title: 'Count Authentication Success',
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
            params: { customLabel: 'Authentication success' },
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
          query: { query: '', language: 'lucene' },
        }),
      },
    },
    _type: 'visualization',
  },
  {
    _id: 'Wazuh-App-Overview-General-Alert-level-evolution',
    _source: {
      title: 'Alert level evolution',
      visState: JSON.stringify({
        title: 'Alert level evolution',
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
            id: '2',
            enabled: true,
            type: 'date_histogram',
            schema: 'segment',
            params: {
              field: 'timestamp',
              timeRange: { from: 'now-24h', to: 'now', mode: 'quick' },
              useNormalizedEsInterval: true,
              interval: 'auto',
              time_zone: 'Europe/Berlin',
              drop_partials: false,
              customInterval: '2h',
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
              field: 'rule.level',
              size: '15',
              order: 'desc',
              orderBy: '1',
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
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
    _id: 'Wazuh-App-Overview-General-Alerts-Top-Mitre',
    _source: {
      title: 'Alerts',
      visState: JSON.stringify({
        type: 'pie',
        aggs: [
          { id: '1', enabled: true, type: 'count', schema: 'metric', params: {} },
          {
            id: '2',
            enabled: true,
            type: 'terms',
            schema: 'segment',
            params: {
              field: 'rule.mitre.technique',
              orderBy: '1',
              order: 'desc',
              size: 20,
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
            },
          },
        ],
        params: {
          type: 'pie',
          addTooltip: true,
          addLegend: true,
          legendPosition: 'right',
          isDonut: true,
          labels: { show: false, values: true, last_level: true, truncate: 100 },
        },
        title: 'mitre top',
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
    _id: 'Wazuh-App-Overview-General-Top-5-agents',
    _source: {
      title: 'Top 5 agents',
      visState: JSON.stringify({
        title: 'Top 5 agents',
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
          { id: '1', enabled: true, type: 'count', schema: 'metric', params: {} },
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
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
            },
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
    _type: 'visualization',
  },
  {
    _id: 'Wazuh-App-Overview-General-Top-5-agents-Evolution',
    _source: {
      title: 'Top 5 rule groups',
      visState: JSON.stringify({
        type: 'histogram',
        aggs: [
          { id: '1', enabled: true, type: 'count', schema: 'metric', params: {} },
          {
            id: '2',
            enabled: true,
            type: 'date_histogram',
            schema: 'segment',
            params: {
              field: 'timestamp',
              timeRange: { from: '2020-07-19T16:18:13.637Z', to: '2020-07-28T13:58:33.357Z' },
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
        params: {
          type: 'area',
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
              drawLinesBetweenPoints: true,
              lineWidth: 2,
              showCircles: true,
              interpolate: 'linear',
              valueAxis: 'ValueAxis-1',
            },
          ],
          addTooltip: true,
          addLegend: true,
          legendPosition: 'right',
          times: [],
          addTimeMarker: false,
          thresholdLine: { show: false, value: 10, width: 1, style: 'full', color: '#E7664C' },
          labels: {},
        },
        title: 'top 5 agents evolution',
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
    _type: 'visualization',
  },
  {
    _id: 'Wazuh-App-Overview-General-Alerts-summary',
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
  {
    _id: 'Wazuh-App-Overview-General-Alerts-evolution-Top-5-agents',
    _type: 'visualization',
    _source: {
      title: 'Alerts evolution Top 5 agents',
      visState: JSON.stringify({
        title: 'Alerts evolution Top 5 agents',
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
            params: { field: 'agent.name', size: 5, order: 'desc', orderBy: '1' },
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
          filter: [],
          query: { query: '', language: 'lucene' },
        }),
      },
    },
  },
];
