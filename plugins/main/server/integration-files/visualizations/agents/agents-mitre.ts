/*
 * Wazuh app - Module for Agents/MITRE visualizations
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
    _id: 'Wazuh-App-Agents-MITRE',
    _source: {
      title: 'Mitre attack count',
      visState: JSON.stringify({
        aggs: [
          { enabled: true, id: '1', params: {}, schema: 'metric', type: 'count' },
          {
            enabled: true,
            id: '2',
            params: {
              field: 'rule.mitre.id',
              customLabel: 'Attack ID',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              order: 'desc',
              orderBy: '1',
              otherBucket: false,
              otherBucketLabel: 'Other',
              size: 244,
            },
            schema: 'bucket',
            type: 'terms',
          },
        ],
        params: {
          dimensions: {
            buckets: [],
            metrics: [{ accessor: 0, aggType: 'count', format: { id: 'number' }, params: {} }],
          },
          perPage: 10,
          percentageCol: '',
          showMetricsAtAllLevels: false,
          showPartialRows: false,
          showTotal: false,
          showToolbar: true,
          sort: { columnIndex: null, direction: null },
          totalFunc: 'sum',
        },
        title: 'mitre',
        type: 'table',
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
    _id: 'Wazuh-App-Agents-MITRE-Alerts-Evolution',
    _source: {
      title: 'Mitre alerts evolution',
      visState: JSON.stringify({
        title: 'Alert Evolution',
        type: 'line',
        params: {
          type: 'line',
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
              type: 'line',
              mode: 'normal',
              data: { label: 'Count', id: '1' },
              valueAxis: 'ValueAxis-1',
              drawLinesBetweenPoints: true,
              showCircles: true,
              lineWidth: 2,
            },
          ],
          addTooltip: true,
          addLegend: true,
          legendPosition: 'right',
          times: [],
          addTimeMarker: false,
          labels: {},
          thresholdLine: { show: false, value: 10, width: 1, style: 'full', color: '#34130C' },
          dimensions: {
            x: {
              accessor: 0,
              format: { id: 'date', params: { pattern: 'YYYY-MM-DD HH:mm' } },
              params: {
                date: true,
                interval: 'PT3H',
                format: 'YYYY-MM-DD HH:mm',
                bounds: { min: '2019-11-07T15:45:45.770Z', max: '2019-11-14T15:45:45.770Z' },
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
              timeRange: { from: 'now-7d', to: 'now' },
              useNormalizedEsInterval: true,
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
              field: 'rule.mitre.technique',
              customLabel: 'Attack ID',
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
          query: { language: 'lucene', query: '' },
        }),
      },
    },
    _type: 'visualization',
  },
  {
    _id: 'Wazuh-App-Agents-MITRE-Attacks-By-Agent',
    _source: {
      title: 'Attacks count by agent',
      visState: JSON.stringify({
        title: 'Attacks count by agent',
        type: 'pie',
        params: {
          addLegend: true,
          addTooltip: true,
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
            ],
          },
          isDonut: true,
          labels: { last_level: true, show: false, truncate: 100, values: true },
          legendPosition: 'right',
          type: 'pie',
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
              customLabel: 'Agent name',
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
              field: 'rule.mitre.id',
              customLabel: 'Attack ID',
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
          query: { language: 'lucene', query: '' },
        }),
      },
    },
    _type: 'visualization',
  },
  {
    _id: 'Wazuh-App-Agents-MITRE-Level-By-Tactic',
    _source: {
      title: 'Alerts level by tactic',
      visState: JSON.stringify({
        title: 'Alerts level by tactic',
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
            id: '3',
            enabled: true,
            type: 'terms',
            schema: 'segment',
            params: {
              field: 'rule.mitre.tactic',
              orderBy: '1',
              order: 'desc',
              size: 5,
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              customLabel: 'Attack ID',
            },
          },
          {
            id: '4',
            enabled: true,
            type: 'terms',
            schema: 'segment',
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
    _id: 'Wazuh-App-Agents-MITRE-Level-By-Attack',
    _source: {
      title: 'Alerts level by attack',
      visState: JSON.stringify({
        title: 'Alerts level by attack',
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
            id: '3',
            enabled: true,
            type: 'terms',
            schema: 'segment',
            params: {
              field: 'rule.mitre.technique',
              orderBy: '1',
              order: 'desc',
              size: 5,
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              customLabel: 'Attack ID',
            },
          },
          {
            id: '4',
            enabled: true,
            type: 'terms',
            schema: 'segment',
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
    _id: 'Wazuh-App-Agents-MITRE-Attacks-By-Tactic',
    _source: {
      title: 'Top tactics',
      visState: JSON.stringify({
        title: 'Attacks by tactic',
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
          thresholdLine: { show: false, value: 10, width: 1, style: 'full', color: '#34130C' },
          dimensions: {
            x: null,
            y: [{ accessor: 1, format: { id: 'number' }, params: {}, aggType: 'count' }],
            series: [
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
            schema: 'group',
            params: {
              field: 'rule.mitre.technique',
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
              field: 'rule.mitre.tactic',
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
          query: { language: 'lucene', query: '' },
        }),
      },
    },
    _type: 'visualization',
  },
  {
    _id: 'Wazuh-App-Agents-MITRE-Top-Tactics',
    _source: {
      title: 'Top tactics pie',
      visState: JSON.stringify({
        title: 'Top tactics PIE2',
        type: 'pie',
        params: {
          type: 'pie',
          addTooltip: true,
          addLegend: true,
          legendPosition: 'right',
          isDonut: false,
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
              field: 'rule.mitre.tactic',
              orderBy: '1',
              order: 'desc',
              size: 10,
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
          query: { language: 'lucene', query: '' },
        }),
      },
    },
    _type: 'visualization',
  },
  {
    _id: 'Wazuh-App-Agents-MITRE-Alerts-summary',
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
