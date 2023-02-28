/*
 * Wazuh app - Module for Agents/GCP visualizations
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
    _id: 'Wazuh-App-Agents-GCP-Top-5-rules',
    _type: 'visualization',
    _source: {
      title: 'Top 5 rules',
      visState: JSON.stringify({
        title: 'Top 5 rules',
        type: 'table',
        params: {
          perPage: 10,
          showPartialRows: false,
          showMetricsAtAllLevels: false,
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
              field: 'rule.id',
              size: 500,
              order: 'desc',
              orderBy: '1',
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              customLabel: 'Rule ID',
            },
          },
          {
            id: '2',
            enabled: true,
            type: 'terms',
            schema: 'bucket',
            params: {
              field: 'rule.description',
              size: 10,
              order: 'desc',
              orderBy: '1',
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              customLabel: 'Event',
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
          query: { query: '', language: 'lucene' },
          filter: [],
        }),
      },
    },
  },
  {
    _id: 'Wazuh-App-Agents-GCP-Event-Query-Name',
    _type: 'visualization',
    _source: {
      title: 'Top query events',
      visState: JSON.stringify({
        title: 'Wazuh-App-Agents-GCP-Query-Name',
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
              field: 'data.gcp.jsonPayload.queryName',
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
      uiStateJSON: '',
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
    _id: 'Wazuh-App-Agents-GCP-Tag-Severities',
    _type: 'visualization',
    _source: {
      title: 'Severities count',
      visState: JSON.stringify({
        title: 'Wazuh-App-Agents-GCP-Tag-Severities',
        type: 'tagcloud',
        params: {
          scale: 'linear',
          orientation: 'single',
          minFontSize: 18,
          maxFontSize: 72,
          showLabel: true,
          metric: { type: 'vis_dimension', accessor: 1, format: { id: 'string', params: {} } },
        },
        aggs: [
          { id: '1', enabled: true, type: 'count', schema: 'metric', params: { customLabel: '' } },
          {
            id: '2',
            enabled: true,
            type: 'terms',
            schema: 'segment',
            params: {
              field: 'data.gcp.severity',
              orderBy: '1',
              order: 'desc',
              size: 5,
              otherBucket: true,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              customLabel: 'Severities',
            },
          },
        ],
      }),
      uiStateJSON: '',
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
    _id: 'Wazuh-App-Agents-GCP-Top-5-instances',
    _type: 'visualization',
    _source: {
      title: 'Top 5 instances',
      visState: JSON.stringify({
        title: 'Wazuh-App-Agents-GCP-Top-5-instances',
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
              field: 'data.gcp.jsonPayload.vmInstanceId',
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
      uiStateJSON: '',
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
    _id: 'Wazuh-App-Agents-GCP-Top-5-resource-type',
    _type: 'visualization',
    _source: {
      title: 'Top 5 Events type',
      visState: JSON.stringify({
        title: 'Wazuh-App-Agents-GCP-Top-5-resource-type',
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
              field: 'data.gcp.resource.type',
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
      uiStateJSON: '',
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
    _id: 'Wazuh-App-Agents-GCP-authAnswer-Bar',
    _type: 'visualization',
    _source: {
      title: 'Auth answer count',
      visState: JSON.stringify({
        title: 'Wazuh-App-Agents-GCP-authAnswer-Bar',
        type: 'histogram',
        params: {
          type: 'histogram',
          grid: { categoryLines: false, valueAxis: 'ValueAxis-1' },
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
          thresholdLine: { show: false, value: 10, width: 1, style: 'full', color: '#34130C' },
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
            y: [{ accessor: 1, format: { id: 'number' }, params: {}, aggType: 'count' }],
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
              field: 'data.gcp.jsonPayload.authAnswer',
              orderBy: '1',
              order: 'desc',
              size: 5,
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              customLabel: 'authAnswer',
            },
          },
        ],
      }),
      uiStateJSON: '',
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
    _id: 'Wazuh-App-Agents-GCP-Events-Over-Time',
    _type: 'visualization',
    _source: {
      title: 'GCP alerts evolution',
      visState: JSON.stringify({
        title: 'Wazuh-App-Agents-GCP-Events-Over-Time',
        type: 'line',
        params: {
          type: 'line',
          grid: { categoryLines: false, valueAxis: 'ValueAxis-1' },
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
          thresholdLine: { show: false, value: 10, width: 1, style: 'full', color: '#34130C' },
          labels: {},
          dimensions: {
            x: {
              accessor: 0,
              format: { id: 'date', params: { pattern: 'YYYY-MM-DD' } },
              params: {
                date: true,
                interval: 'P1D',
                format: 'YYYY-MM-DD',
                bounds: { min: '2019-09-07T14:30:14.047Z', max: '2019-11-07T14:19:07.505Z' },
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
              timeRange: { from: 'now-2M', to: '2019-11-07T14:19:07.505Z' },
              useNormalizedEsInterval: true,
              interval: 'auto',
              drop_partials: false,
              min_doc_count: 1,
              extended_bounds: {},
              customLabel: '',
            },
          },
        ],
      }),
      uiStateJSON: '',
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
    _id: 'Wazuh-App-Agents-GCP-Top-ResourceType-By-Project-Id',
    _source: {
      title: 'Resource type by project id',
      visState: JSON.stringify({
        title: 'Top resource type by project',
        type: 'horizontal_bar',
        params: {
          addLegend: true,
          addTimeMarker: false,
          addTooltip: true,
          categoryAxes: [
            {
              id: 'CategoryAxis-1',
              labels: { filter: false, rotate: 0, show: true, truncate: 200 },
              position: 'bottom',
              scale: { type: 'linear' },
              show: true,
              style: {},
              title: {},
              type: 'category',
            },
          ],
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
          grid: { categoryLines: false },
          labels: {},
          legendPosition: 'right',
          seriesParams: [
            {
              data: { id: '1', label: 'Count' },
              drawLinesBetweenPoints: true,
              mode: 'normal',
              show: true,
              showCircles: true,
              type: 'histogram',
              valueAxis: 'ValueAxis-1',
            },
          ],
          times: [],
          type: 'histogram',
          valueAxes: [
            {
              id: 'ValueAxis-1',
              labels: { filter: true, rotate: 75, show: true, truncate: 100 },
              name: 'LeftAxis-2',
              position: 'left',
              scale: { mode: 'normal', type: 'linear' },
              show: true,
              style: {},
              title: { text: 'Count' },
              type: 'value',
            },
          ],
        },
        aggs: [
          { id: '1', enabled: true, type: 'count', schema: 'metric', params: {} },
          {
            id: '2',
            enabled: true,
            type: 'terms',
            schema: 'segment',
            params: {
              field: 'data.gcp.resource.labels.project_id',
              orderBy: '1',
              order: 'desc',
              size: 5,
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              customLabel: 'Project ID',
            },
          },
          {
            id: '3',
            enabled: true,
            type: 'terms',
            schema: 'group',
            params: {
              field: 'data.gcp.resource.type',
              orderBy: '1',
              order: 'desc',
              size: 5,
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              customLabel: 'Resource type',
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
    _id: 'Wazuh-App-Agents-GCP-Top-ProjectId-By-SourceType',
    _source: {
      title: 'Top project id by sourcetype',
      visState: JSON.stringify({
        title: 'top project id by source type',
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
              {
                accessor: 4,
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
            id: '4',
            enabled: true,
            type: 'terms',
            schema: 'segment',
            params: {
              field: 'data.gcp.resource.labels.location',
              customLabel: 'Location',
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
            type: 'terms',
            schema: 'segment',
            params: {
              field: 'data.gcp.resource.labels.project_id',
              customLabel: 'Project ID',
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
            id: '3',
            enabled: true,
            type: 'terms',
            schema: 'segment',
            params: {
              field: 'data.gcp.resource.labels.source_type',
              customLabel: 'Source type',
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
    _id: 'Wazuh-App-Agents-GCP-Alerts-summary',
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
              size: 50,
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
              size: 1,
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
              size: 1,
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
