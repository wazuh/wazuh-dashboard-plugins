/*
 * Wazuh app - Module for Overview/NIST visualizations
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
    _id: 'Wazuh-App-Overview-NIST-Requirements-over-time',
    _source: {
      title: 'Requirements over time',
      visState: JSON.stringify({
        title: 'NIST-Requirements-over-time',
        type: 'histogram',
        params: {
          type: 'histogram',
          grid: { categoryLines: true, valueAxis: 'ValueAxis-1' },
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
              type: 'line',
              mode: 'normal',
              data: { label: 'Count', id: '1' },
              valueAxis: 'ValueAxis-1',
              drawLinesBetweenPoints: true,
              showCircles: true,
              interpolate: 'linear',
            },
          ],
          addTooltip: true,
          addLegend: true,
          legendPosition: 'right',
          times: [],
          addTimeMarker: false,
          labels: { show: false },
          dimensions: {
            x: {
              accessor: 0,
              format: { id: 'date', params: { pattern: 'YYYY-MM-DD HH:mm' } },
              params: {
                date: true,
                interval: 'PT1H',
                format: 'YYYY-MM-DD HH:mm',
                bounds: { min: '2019-08-20T12:33:23.360Z', max: '2019-08-22T12:33:23.360Z' },
              },
              aggType: 'date_histogram',
            },
            y: [{ accessor: 2, format: { id: 'number' }, params: {}, aggType: 'count' }],
            series: [
              {
                accessor: 1,
                format: {
                  id: 'terms',
                  params: {
                    id: 'string',
                    otherBucketLabel: 'Other',
                    missingBucketLabel: 'Missing',
                  },
                },
                params: {},
                aggType: 'terms',
              },
            ],
          },
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
              timeRange: { from: 'now-2d', to: 'now' },
              useNormalizedEsInterval: true,
              interval: 'auto',
              drop_partials: false,
              min_doc_count: 1,
              extended_bounds: {},
            },
          },
          {
            id: '4',
            enabled: true,
            type: 'terms',
            schema: 'group',
            params: {
              field: 'rule.nist_800_53',
              orderBy: '1',
              order: 'desc',
              size: 50,
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              customLabel: 'Requirement',
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
          query: { language: 'lucene', query: '' },
        }),
      },
    },
    _type: 'visualization',
  },
  {
    _id: 'Wazuh-App-Overview-NIST-Requirements-Agents-heatmap',
    _type: 'visualization',
    _source: {
      title: 'Alerts volume by agent',
      visState: JSON.stringify({
        aggs: [
          { enabled: true, id: '1', params: {}, schema: 'metric', type: 'count' },
          {
            enabled: true,
            id: '3',
            params: {
              customLabel: 'Requirement',
              field: 'rule.nist_800_53',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              order: 'desc',
              orderBy: '1',
              otherBucket: false,
              otherBucketLabel: 'Other',
              size: 10,
            },
            schema: 'group',
            type: 'terms',
          },
          {
            enabled: true,
            id: '2',
            params: {
              customLabel: 'Agent',
              field: 'agent.id',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              order: 'desc',
              orderBy: '1',
              otherBucket: false,
              otherBucketLabel: 'Other',
              size: 5,
            },
            schema: 'segment',
            type: 'terms',
          },
        ],
        params: {
          addLegend: true,
          addTooltip: true,
          colorSchema: 'Blues',
          colorsNumber: 10,
          colorsRange: [],
          dimensions: {
            series: [
              {
                accessor: 0,
                aggType: 'terms',
                format: {
                  id: 'terms',
                  params: {
                    id: 'string',
                    missingBucketLabel: 'Missing',
                    otherBucketLabel: 'Other',
                  },
                },
                params: {},
              },
            ],
            x: {
              accessor: 1,
              aggType: 'terms',
              format: {
                id: 'terms',
                params: { id: 'string', missingBucketLabel: 'Missing', otherBucketLabel: 'Other' },
              },
              params: {},
            },
            y: [{ accessor: 2, aggType: 'count', format: { id: 'number' }, params: {} }],
          },
          enableHover: false,
          invertColors: false,
          legendPosition: 'right',
          percentageMode: false,
          setColorRange: false,
          times: [],
          type: 'heatmap',
          valueAxes: [
            {
              id: 'ValueAxis-1',
              labels: { color: 'black', overwriteColor: false, rotate: 0, show: false },
              scale: { defaultYExtents: false, type: 'linear' },
              show: false,
              type: 'value',
            },
          ],
        },
        title: 'NIST-Last-alerts',
        type: 'heatmap',
      }),
      uiStateJSON: JSON.stringify({
        vis: {
          defaultColors: {
            '0 - 160': 'rgb(247,251,255)',
            '160 - 320': 'rgb(227,238,249)',
            '320 - 480': 'rgb(208,225,242)',
            '480 - 640': 'rgb(182,212,233)',
            '640 - 800': 'rgb(148,196,223)',
            '800 - 960': 'rgb(107,174,214)',
            '960 - 1,120': 'rgb(74,152,201)',
            '1,120 - 1,280': 'rgb(46,126,188)',
            '1,280 - 1,440': 'rgb(23,100,171)',
            '1,440 - 1,600': 'rgb(8,74,145)',
          },
        },
      }),
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
  {
    _id: 'Wazuh-App-Overview-NIST-requirements-by-agents',
    _source: {
      title: 'Requirements distribution by agent',
      visState: JSON.stringify({
        title: 'NIST-Top-requirements-by-agent',
        type: 'area',
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
              show: 'true',
              type: 'histogram',
              mode: 'stacked',
              data: { label: 'Count', id: '1' },
              drawLinesBetweenPoints: true,
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
          dimensions: {
            x: {
              accessor: 0,
              format: {
                id: 'terms',
                params: { id: 'string', otherBucketLabel: 'Other', missingBucketLabel: 'Missing' },
              },
              params: {},
              aggType: 'terms',
            },
            y: [{ accessor: 2, format: { id: 'number' }, params: {}, aggType: 'count' }],
            series: [
              {
                accessor: 1,
                format: {
                  id: 'terms',
                  params: {
                    id: 'string',
                    otherBucketLabel: 'Other',
                    missingBucketLabel: 'Missing',
                  },
                },
                params: {},
                aggType: 'terms',
              },
            ],
          },
        },
        aggs: [
          { id: '1', enabled: true, type: 'count', schema: 'metric', params: {} },
          {
            id: '2',
            enabled: true,
            type: 'terms',
            schema: 'segment',
            params: {
              field: 'agent.id',
              orderBy: '1',
              order: 'desc',
              size: 5,
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              customLabel: 'Agent',
            },
          },
          {
            id: '3',
            enabled: true,
            type: 'terms',
            schema: 'group',
            params: {
              field: 'rule.nist_800_53',
              orderBy: '1',
              order: 'desc',
              size: 10,
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              customLabel: 'Requirement',
            },
          },
        ],
      }),
      uiStateJSON: JSON.stringify({ vis: { legendOpen: false } }),
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
    _id: 'Wazuh-App-Overview-NIST-Metrics',
    _source: {
      title: 'Stats',
      visState: JSON.stringify({
        title: 'nist-metrics',
        type: 'metric',
        params: {
          metric: {
            percentageMode: false,
            useRanges: false,
            colorSchema: 'Green to Red',
            metricColorMode: 'None',
            colorsRange: [{ type: 'range', from: 0, to: 10000 }],
            labels: { show: true },
            invertColors: false,
            style: { bgFill: '#000', bgColor: false, labelColor: false, subText: '', fontSize: 20 },
          },
          dimensions: {
            metrics: [
              { type: 'vis_dimension', accessor: 0, format: { id: 'number', params: {} } },
              { type: 'vis_dimension', accessor: 1, format: { id: 'number', params: {} } },
            ],
          },
          addTooltip: true,
          addLegend: false,
          type: 'metric',
        },
        aggs: [
          {
            id: '1',
            enabled: true,
            type: 'count',
            schema: 'metric',
            params: { customLabel: 'Total alerts' },
          },
          {
            id: '2',
            enabled: true,
            type: 'max',
            schema: 'metric',
            params: { field: 'rule.level', customLabel: 'Max rule level detected' },
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
    _id: 'Wazuh-App-Overview-NIST-Top-10-requirements',
    _source: {
      title: 'Top 10 requirements',
      visState: JSON.stringify({
        title: 'NIST-Top-10-requirements',
        type: 'pie',
        params: {
          type: 'pie',
          addTooltip: true,
          addLegend: true,
          legendPosition: 'right',
          isDonut: true,
          labels: { show: false, values: true, last_level: true, truncate: 100 },
          dimensions: {
            metric: { accessor: 1, format: { id: 'number' }, params: {}, aggType: 'count' },
            buckets: [
              {
                accessor: 0,
                format: {
                  id: 'terms',
                  params: {
                    id: 'string',
                    otherBucketLabel: 'Other',
                    missingBucketLabel: 'Missing',
                  },
                },
                params: {},
                aggType: 'terms',
              },
            ],
          },
        },
        aggs: [
          { id: '1', enabled: true, type: 'count', schema: 'metric', params: {} },
          {
            id: '2',
            enabled: true,
            type: 'terms',
            schema: 'segment',
            params: {
              field: 'rule.nist_800_53',
              orderBy: '1',
              order: 'desc',
              size: 10,
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              customLabel: 'Requirement',
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
    _id: 'Wazuh-App-Overview-NIST-Agents',
    _source: {
      title: 'Most active agents',
      visState: JSON.stringify({
        title: 'NIST-Top-10-agents',
        type: 'pie',
        params: {
          type: 'pie',
          addTooltip: true,
          addLegend: true,
          legendPosition: 'right',
          isDonut: true,
          labels: { show: false, values: true, last_level: true, truncate: 100 },
          dimensions: {
            metric: { accessor: 1, format: { id: 'number' }, params: {}, aggType: 'count' },
            buckets: [
              {
                accessor: 0,
                format: {
                  id: 'terms',
                  params: {
                    id: 'string',
                    otherBucketLabel: 'Other',
                    missingBucketLabel: 'Missing',
                  },
                },
                params: {},
                aggType: 'terms',
              },
            ],
          },
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
              orderBy: '1',
              order: 'desc',
              size: 10,
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              customLabel: 'Agent',
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
    _id: 'Wazuh-App-Overview-NIST-Alerts-summary',
    _type: 'visualization',
    _source: {
      title: 'Alerts summary',
      visState: JSON.stringify({
        title: 'NIST-Alerts-summary',
        type: 'table',
        params: {
          perPage: 10,
          showPartialRows: false,
          showMetricsAtAllLevels: false,
          sort: { columnIndex: 3, direction: 'desc' },
          showTotal: false,
          showToolbar: true,
          totalFunc: 'sum',
          dimensions: {
            metrics: [{ accessor: 3, format: { id: 'number' }, params: {}, aggType: 'count' }],
            buckets: [
              {
                accessor: 0,
                format: {
                  id: 'terms',
                  params: {
                    id: 'string',
                    otherBucketLabel: 'Other',
                    missingBucketLabel: 'Missing',
                  },
                },
                params: {},
                aggType: 'terms',
              },
              {
                accessor: 1,
                format: {
                  id: 'terms',
                  params: {
                    id: 'string',
                    otherBucketLabel: 'Other',
                    missingBucketLabel: 'Missing',
                  },
                },
                params: {},
                aggType: 'terms',
              },
              {
                accessor: 2,
                format: {
                  id: 'terms',
                  params: {
                    id: 'number',
                    otherBucketLabel: 'Other',
                    missingBucketLabel: 'Missing',
                  },
                },
                params: {},
                aggType: 'terms',
              },
            ],
          },
        },
        aggs: [
          { id: '1', enabled: true, type: 'count', schema: 'metric', params: {} },
          {
            id: '2',
            enabled: true,
            type: 'terms',
            schema: 'bucket',
            params: {
              field: 'agent.name',
              orderBy: '1',
              order: 'desc',
              size: 50,
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              customLabel: 'Agent',
            },
          },
          {
            id: '3',
            enabled: true,
            type: 'terms',
            schema: 'bucket',
            params: {
              field: 'rule.nist_800_53',
              orderBy: '1',
              order: 'desc',
              size: 20,
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              customLabel: 'Requirement',
            },
          },
          {
            id: '4',
            enabled: true,
            type: 'terms',
            schema: 'bucket',
            params: {
              field: 'rule.level',
              orderBy: '1',
              order: 'desc',
              size: 5,
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              customLabel: 'Rule level',
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
