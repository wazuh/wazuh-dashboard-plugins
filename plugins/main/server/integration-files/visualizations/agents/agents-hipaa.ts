/*
 * Wazuh app - Module for Agents/HIPAA visualizations
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
    _id: 'Wazuh-App-Agents-HIPAA-Burbles',
    _source: {
      title: 'HIPAA requirements',
      visState: JSON.stringify({
        title: 'HIPAA requirements',
        type: 'line',
        params: {
          type: 'line',
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
              drawLinesBetweenPoints: false,
              showCircles: true,
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
              format: { id: 'date', params: { pattern: 'YYYY-MM-DD HH:mm' } },
              params: {
                date: true,
                interval: 'PT12H',
                format: 'YYYY-MM-DD HH:mm',
                bounds: { min: '2019-07-24T10:27:37.970Z', max: '2019-08-23T10:27:37.970Z' },
              },
              aggType: 'date_histogram',
            },
            y: [{ accessor: 2, format: { id: 'number' }, params: {}, aggType: 'count' }],
            z: [{ accessor: 3, format: { id: 'number' }, params: {}, aggType: 'count' }],
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
          radiusRatio: 20,
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
              timeRange: { from: 'now-30d', to: 'now' },
              useNormalizedEsInterval: true,
              interval: 'auto',
              drop_partials: false,
              min_doc_count: 1,
              extended_bounds: {},
              customLabel: 'Timestampt',
            },
          },
          {
            id: '3',
            enabled: true,
            type: 'terms',
            schema: 'group',
            params: {
              field: 'rule.hipaa',
              orderBy: '1',
              order: 'desc',
              size: 5,
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              customLabel: 'Requirement',
            },
          },
          { id: '4', enabled: true, type: 'count', schema: 'radius', params: {} },
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
    _id: 'Wazuh-App-Agents-HIPAA-Distributed-By-Level',
    _source: {
      title: 'Requirements distribution by level',
      visState: JSON.stringify({
        title: 'Requirements distribution by level',
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
          labels: { show: false },
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
          orderBucketsBySum: true,
        },
        aggs: [
          { id: '1', enabled: true, type: 'count', schema: 'metric', params: {} },
          {
            id: '2',
            enabled: true,
            type: 'terms',
            schema: 'segment',
            params: {
              field: 'rule.hipaa',
              orderBy: '1',
              order: 'desc',
              size: 5,
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              customLabel: 'Requirement',
            },
          },
          {
            id: '3',
            enabled: true,
            type: 'terms',
            schema: 'group',
            params: {
              field: 'rule.level',
              orderBy: '1',
              order: 'desc',
              size: 5,
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              customLabel: 'Level',
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
    _id: 'Wazuh-App-Agents-HIPAA-Most-Common',
    _source: {
      title: 'Most common alerts',
      visState: JSON.stringify({
        title: 'Most common alerts',
        type: 'tagcloud',
        params: {
          scale: 'linear',
          orientation: 'single',
          minFontSize: 15,
          maxFontSize: 25,
          showLabel: true,
          metric: { type: 'vis_dimension', accessor: 1, format: { id: 'string', params: {} } },
          bucket: {
            type: 'vis_dimension',
            accessor: 0,
            format: {
              id: 'terms',
              params: { id: 'string', otherBucketLabel: 'Other', missingBucketLabel: 'Missing' },
            },
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
              field: 'rule.hipaa',
              orderBy: '1',
              order: 'desc',
              size: 5,
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
    _id: 'Wazuh-App-Agents-HIPAA-top-10',
    _source: {
      title: 'Top 10 requirements',
      visState: JSON.stringify({
        title: 'Top 10 requirements',
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
              field: 'rule.hipaa',
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
    _id: 'Wazuh-App-Agents-HIPAA-Requirements-Stacked-Overtime',
    _source: {
      title: 'Requirements over time',
      visState: JSON.stringify({
        title: 'Requirements over time',
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
          labels: { show: false },
          dimensions: {
            x: {
              accessor: 0,
              format: { id: 'date', params: { pattern: 'YYYY-MM-DD HH:mm' } },
              params: {
                date: true,
                interval: 'PT1H',
                format: 'YYYY-MM-DD HH:mm',
                bounds: { min: '2019-08-19T09:19:10.911Z', max: '2019-08-23T09:19:10.911Z' },
              },
              aggType: 'date_histogram',
            },
            y: [{ accessor: 1, format: { id: 'number' }, params: {}, aggType: 'count' }],
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
              timeRange: { from: 'now-4d', to: 'now' },
              useNormalizedEsInterval: true,
              interval: 'auto',
              drop_partials: false,
              min_doc_count: 1,
              extended_bounds: {},
              customLabel: 'Timestampt',
            },
          },
          {
            id: '3',
            enabled: true,
            type: 'terms',
            schema: 'group',
            params: {
              field: 'rule.hipaa',
              orderBy: '1',
              order: 'desc',
              size: 5,
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
    _id: 'Wazuh-App-Agents-HIPAA-Last-alerts',
    _type: 'visualization',
    _source: {
      title: 'Alerts summary',
      visState: JSON.stringify({
        title: 'Alerts summary',
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
                    id: 'number',
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
            id: '3',
            enabled: true,
            type: 'terms',
            schema: 'bucket',
            params: {
              field: 'rule.hipaa',
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
          {
            id: '5',
            enabled: true,
            type: 'terms',
            schema: 'bucket',
            params: {
              field: 'rule.description',
              orderBy: '1',
              order: 'desc',
              size: 200,
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              customLabel: 'Description',
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
