/*
 * Wazuh app - Module for Overview/PM visualizations
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
    _id: 'Wazuh-App-Overview-PM-Malware-Activity',
    _type: 'visualization',
    _source: {
      title: 'Malware activity',
      visState: JSON.stringify({
        title: 'Malware activity',
        type: 'area',
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
            id: '3',
            enabled: true,
            type: 'filters',
            params: {
              filters: [
                {
                  input: {
                    query: 'rule.groups : "rootcheck"',
                    language: 'kuery',
                  },
                  label: '',
                },
              ],
            },
            schema: 'group',
          },
          {
            id: '2',
            enabled: true,
            type: 'date_histogram',
            params: {
              field: 'timestamp',
              timeRange: {
                from: 'now-24h',
                to: 'now',
              },
              useNormalizedOpenSearchInterval: true,
              scaleMetricValues: false,
              interval: 'auto',
              drop_partials: false,
              min_doc_count: 1,
              extended_bounds: {},
            },
            schema: 'segment',
          },
        ],
        params: {
          type: 'area',
          grid: {
            categoryLines: false,
          },
          categoryAxes: [
            {
              id: 'CategoryAxis-1',
              type: 'category',
              position: 'bottom',
              show: true,
              style: {},
              scale: {
                type: 'linear',
              },
              labels: {
                show: true,
                filter: true,
                truncate: 100,
              },
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
              scale: {
                type: 'linear',
                mode: 'normal',
              },
              labels: {
                show: true,
                rotate: 0,
                filter: false,
                truncate: 100,
              },
              title: {
                text: 'Count',
              },
            },
          ],
          seriesParams: [
            {
              show: true,
              type: 'area',
              mode: 'stacked',
              data: {
                label: 'Count',
                id: '1',
              },
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
          thresholdLine: {
            show: false,
            value: 10,
            width: 1,
            style: 'full',
            color: '#E7664C',
          },
          labels: {},
          row: true,
        },
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
  {
    _id: 'Wazuh-App-Overview-PM-Rootkits-Activity-Over-Time',
    _type: 'visualization',
    _source: {
      title: 'Top 5 rules',
      visState: JSON.stringify({
        title: 'Rootkits activity over time',
        type: 'line',
        aggs: [
          {
            id: '1',
            enabled: true,
            type: 'count',
            params: {
              customLabel: 'Alerts',
            },
            schema: 'metric',
          },
          {
            id: '4',
            enabled: true,
            type: 'terms',
            params: {
              field: 'data.title',
              orderBy: '1',
              order: 'desc',
              size: 5,
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
            },
            schema: 'group',
          },
          {
            id: '2',
            enabled: true,
            type: 'date_histogram',
            params: {
              field: 'timestamp',
              timeRange: {
                from: 'now-1M',
                to: 'now',
              },
              useNormalizedOpenSearchInterval: true,
              scaleMetricValues: false,
              interval: 'auto',
              drop_partials: false,
              min_doc_count: 1,
              extended_bounds: {},
            },
            schema: 'segment',
          },
        ],
        params: {
          type: 'line',
          grid: {
            categoryLines: false,
          },
          categoryAxes: [
            {
              id: 'CategoryAxis-1',
              type: 'category',
              position: 'bottom',
              show: true,
              style: {},
              scale: {
                type: 'linear',
              },
              labels: {
                show: true,
                filter: true,
                truncate: 100,
              },
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
              scale: {
                type: 'linear',
                mode: 'normal',
              },
              labels: {
                show: true,
                rotate: 0,
                filter: false,
                truncate: 100,
              },
              title: {
                text: 'Alerts',
              },
            },
          ],
          seriesParams: [
            {
              show: true,
              type: 'line',
              mode: 'normal',
              data: {
                label: 'Alerts',
                id: '1',
              },
              valueAxis: 'ValueAxis-1',
              drawLinesBetweenPoints: true,
              lineWidth: 2,
              interpolate: 'linear',
              showCircles: true,
            },
          ],
          addTooltip: true,
          addLegend: true,
          legendPosition: 'right',
          times: [],
          addTimeMarker: false,
          labels: {},
          thresholdLine: {
            show: false,
            value: 10,
            width: 1,
            style: 'full',
            color: '#E7664C',
          },
          row: true,
        },
      }),
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON: JSON.stringify({
          index: 'wazuh-alerts',
          query: { query: '', language: 'lucene' },
          filter: [],
        }),
      },
    },
  },
  // {
  //   _id: 'Wazuh-App-Overview-PM-Top-5-agents-pie',
  //   _type: 'visualization',
  //   _source: {
  //     title: 'Top 5 agents pie',
  //     visState: JSON.stringify({
  //       title: 'Top 5 agents pie',
  //       type: 'pie',
  //       params: {
  //         type: 'pie',
  //         addTooltip: true,
  //         addLegend: true,
  //         legendPosition: 'right',
  //         isDonut: true,
  //         labels: {
  //           show: false,
  //           values: true,
  //           last_level: true,
  //           truncate: 100,
  //         },
  //       },
  //       aggs: [
  //         {
  //           id: '1',
  //           enabled: true,
  //           type: 'count',
  //           schema: 'metric',
  //           params: {},
  //         },
  //         {
  //           id: '2',
  //           enabled: true,
  //           type: 'terms',
  //           schema: 'segment',
  //           params: {
  //             field: 'agent.name',
  //             size: 5,
  //             order: 'desc',
  //             orderBy: '1',
  //             otherBucket: false,
  //             otherBucketLabel: 'Other',
  //             missingBucket: false,
  //             missingBucketLabel: 'Missing',
  //           },
  //         },
  //       ],
  //     }),
  //     uiStateJSON: '{}',
  //     description: '',
  //     version: 1,
  //     kibanaSavedObjectMeta: {
  //       searchSourceJSON: JSON.stringify({
  //         index: 'wazuh-alerts',
  //         query: { language: 'lucene', query: '' },
  //         filter: [],
  //       }),
  //     },
  //   },
  // },
  {
    _id: 'Wazuh-App-Overview-PM-Security-Alerts',
    _type: 'visualization',
    _source: {
      title: 'Security alerts',
      visState: JSON.stringify({
        title: 'Security alerts',
        type: 'table',
        aggs: [
          {
            id: '1',
            enabled: true,
            type: 'count',
            params: {
              customLabel: '',
            },
            schema: 'metric',
          },
          {
            id: '2',
            enabled: true,
            type: 'date_histogram',
            params: {
              field: 'timestamp',
              timeRange: {
                from: 'now-24h',
                to: 'now',
              },
              useNormalizedOpenSearchInterval: true,
              scaleMetricValues: false,
              interval: 'auto',
              drop_partials: false,
              min_doc_count: 1,
              extended_bounds: {},
              customLabel: 'Time',
            },
            schema: 'bucket',
          },
          {
            id: '3',
            enabled: true,
            type: 'terms',
            params: {
              field: 'agent.name',
              orderBy: '_key',
              order: 'desc',
              size: 5,
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              customLabel: 'agent.name',
            },
            schema: 'bucket',
          },
          {
            id: '4',
            enabled: true,
            type: 'terms',
            params: {
              field: 'rule.description',
              orderBy: '_key',
              order: 'desc',
              size: 5,
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              customLabel: 'rule.description',
            },
            schema: 'bucket',
          },
          {
            id: '5',
            enabled: true,
            type: 'terms',
            params: {
              field: 'rule.level',
              orderBy: '_key',
              order: 'desc',
              size: 5,
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              customLabel: 'rule.level',
            },
            schema: 'bucket',
          },
          {
            id: '6',
            enabled: true,
            type: 'terms',
            params: {
              field: 'rule.id',
              orderBy: '_key',
              order: 'desc',
              size: 5,
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              customLabel: 'rule.id',
            },
            schema: 'bucket',
          },
        ],
        params: {
          perPage: 10,
          showPartialRows: false,
          showMetricsAtAllLevels: false,
          showTotal: false,
          totalFunc: 'sum',
          percentageCol: '',
          row: false,
        },
      }),
      uiStateJSON: JSON.stringify({
        vis: {
          columnsWidth: [
            {
              colIndex: 0,
              width: 200,
            },
            {
              colIndex: 3,
              width: 100,
            },
            {
              colIndex: 4,
              width: 100,
            },
            {
              colIndex: 5,
              width: 100,
            },
          ],
        },
      }),
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON: JSON.stringify({
          index: 'wazuh-alerts',
          query: { language: 'lucene', query: '' },
          filter: [],
        }),
      },
    },
  },
  // {
  //   _id: 'Wazuh-App-Overview-PM-Events-per-agent-evolution',
  //   _source: {
  //     title: 'Events per control type evolution',
  //     visState: JSON.stringify({
  //       title: 'Events per control type evolution',
  //       type: 'line',
  //       params: {
  //         type: 'line',
  //         grid: { categoryLines: false, style: { color: '#eee' } },
  //         categoryAxes: [
  //           {
  //             id: 'CategoryAxis-1',
  //             type: 'category',
  //             position: 'bottom',
  //             show: true,
  //             style: {},
  //             scale: { type: 'linear' },
  //             labels: { show: true, filter: true, truncate: 100 },
  //             title: {},
  //           },
  //         ],
  //         valueAxes: [
  //           {
  //             id: 'ValueAxis-1',
  //             name: 'LeftAxis-1',
  //             type: 'value',
  //             position: 'left',
  //             show: true,
  //             style: {},
  //             scale: { type: 'linear', mode: 'normal' },
  //             labels: { show: true, rotate: 0, filter: false, truncate: 100 },
  //             title: { text: 'Count' },
  //           },
  //         ],
  //         seriesParams: [
  //           {
  //             show: 'true',
  //             type: 'line',
  //             mode: 'normal',
  //             data: { label: 'Count', id: '1' },
  //             valueAxis: 'ValueAxis-1',
  //             drawLinesBetweenPoints: true,
  //             showCircles: true,
  //           },
  //         ],
  //         addTooltip: true,
  //         addLegend: true,
  //         legendPosition: 'right',
  //         times: [],
  //         addTimeMarker: false,
  //       },
  //       aggs: [
  //         {
  //           id: '1',
  //           enabled: true,
  //           type: 'count',
  //           schema: 'metric',
  //           params: {},
  //         },
  //         {
  //           id: '3',
  //           enabled: true,
  //           type: 'terms',
  //           schema: 'group',
  //           params: {
  //             field: 'data.title',
  //             size: 5,
  //             order: 'desc',
  //             orderBy: '1',
  //           },
  //         },
  //         {
  //           id: '2',
  //           enabled: true,
  //           type: 'date_histogram',
  //           schema: 'segment',
  //           params: {
  //             field: 'timestamp',
  //             interval: 'auto',
  //             customInterval: '2h',
  //             min_doc_count: 1,
  //             extended_bounds: {},
  //           },
  //         },
  //       ],
  //     }),
  //     uiStateJSON: '{}',
  //     description: '',
  //     version: 1,
  //     kibanaSavedObjectMeta: {
  //       searchSourceJSON: JSON.stringify({
  //         index: 'wazuh-alerts',
  //         filter: [],
  //         query: { query: '', language: 'lucene' },
  //       }),
  //     },
  //   },
  //   _type: 'visualization',
  // },
  // {
  //   _id: 'Wazuh-App-Overview-PM-Alerts-summary',
  //   _type: 'visualization',
  //   _source: {
  //     title: 'Alerts summary',
  //     visState: JSON.stringify({
  //       title: 'Alerts summary',
  //       type: 'table',
  //       params: {
  //         perPage: 10,
  //         showPartialRows: false,
  //         showMeticsAtAllLevels: false,
  //         sort: { columnIndex: 2, direction: 'desc' },
  //         showTotal: false,
  //         showToolbar: true,
  //         totalFunc: 'sum',
  //       },
  //       aggs: [
  //         {
  //           id: '1',
  //           enabled: true,
  //           type: 'count',
  //           schema: 'metric',
  //           params: {},
  //         },
  //         {
  //           id: '3',
  //           enabled: true,
  //           type: 'terms',
  //           schema: 'bucket',
  //           params: {
  //             field: 'rule.description',
  //             otherBucket: false,
  //             otherBucketLabel: 'Other',
  //             missingBucket: false,
  //             missingBucketLabel: 'Missing',
  //             size: 50,
  //             order: 'desc',
  //             orderBy: '1',
  //             customLabel: 'Rule description',
  //           },
  //         },
  //         {
  //           id: '4',
  //           enabled: true,
  //           type: 'terms',
  //           schema: 'bucket',
  //           params: {
  //             field: 'data.title',
  //             otherBucket: false,
  //             otherBucketLabel: 'Other',
  //             missingBucket: false,
  //             missingBucketLabel: 'Missing',
  //             size: 1000,
  //             order: 'desc',
  //             orderBy: '1',
  //             customLabel: 'Control',
  //           },
  //         },
  //       ],
  //     }),
  //     uiStateJSON: JSON.stringify({
  //       vis: { params: { sort: { columnIndex: 1, direction: 'desc' } } },
  //     }),
  //     description: '',
  //     version: 1,
  //     kibanaSavedObjectMeta: {
  //       searchSourceJSON: JSON.stringify({
  //         index: 'wazuh-alerts',
  //         filter: [],
  //         query: { language: 'lucene', query: '' },
  //       }),
  //     },
  //   },
  // },
];
