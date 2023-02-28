/*
 * Wazuh app - Module for Overview/HIPAA visualizations
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
    _id: 'Wazuh-App-Overview-HIPAA-Tag-cloud',
    _source: {
      title: 'Most common alerts',
      visState: JSON.stringify({
        title: 'Most common alerts',
        type: 'tagcloud',
        params: {
          scale: 'linear',
          orientation: 'single',
          minFontSize: 10,
          maxFontSize: 30,
          showLabel: false,
          metric: { type: 'vis_dimension', accessor: 1, format: { id: 'string', params: {} } },
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
          query: { language: 'lucene', query: '' },
        }),
      },
    },
    _type: 'visualization',
  },
  {
    _id: 'Wazuh-App-Overview-HIPAA-Top-10-requirements',
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
    _id: 'Wazuh-App-Overview-HIPAA-Top-10-agents',
    _source: {
      title: 'Most active agents',
      visState: JSON.stringify({
        title: 'Most active agents',
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
              customLabel: 'Agent',
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
    _id: 'Wazuh-App-Overview-HIPAA-Metrics',
    _source: {
      title: 'Stats',
      visState: JSON.stringify({
        title: 'Stats',
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
          query: { language: 'lucene', query: '' },
        }),
      },
    },
    _type: 'visualization',
  },
  {
    _id: 'Wazuh-App-Overview-HIPAA-Alerts-summary',
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
          query: { language: 'lucene', query: '' },
        }),
      },
    },
    _type: 'visualization',
  },
  {
    _id: 'Wazuh-App-Overview-HIPAA-Heatmap',
    _source: {
      title: 'Alerts volume by agent',
      visState: JSON.stringify({
        title: 'Alerts volume by agent',
        type: 'heatmap',
        params: {
          type: 'heatmap',
          addTooltip: true,
          addLegend: true,
          enableHover: false,
          legendPosition: 'right',
          times: [],
          colorsNumber: 10,
          colorSchema: 'Greens',
          setColorRange: false,
          colorsRange: [],
          invertColors: false,
          percentageMode: false,
          valueAxes: [
            {
              show: false,
              id: 'ValueAxis-1',
              type: 'value',
              scale: { type: 'linear', defaultYExtents: false },
              labels: { show: false, rotate: 0, overwriteColor: false, color: 'black' },
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
              customLabel: 'Agent ID',
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
      uiStateJSON: JSON.stringify({
        vis: {
          defaultColors: {
            '0 - 260': 'rgb(247,252,245)',
            '260 - 520': 'rgb(233,247,228)',
            '520 - 780': 'rgb(211,238,205)',
            '780 - 1,040': 'rgb(184,227,177)',
            '1,040 - 1,300': 'rgb(152,213,148)',
            '1,300 - 1,560': 'rgb(116,196,118)',
            '1,560 - 1,820': 'rgb(75,176,98)',
            '1,820 - 2,080': 'rgb(47,152,79)',
            '2,080 - 2,340': 'rgb(21,127,59)',
            '2,340 - 2,600': 'rgb(0,100,40)',
          },
          legendOpen: true,
        },
      }),
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
    _id: 'Wazuh-App-Overview-HIPAA-Top-10-requirements-over-time-by-agent',
    _source: {
      title: 'Requirements distribution by agent',
      visState: JSON.stringify({
        title: 'Requirements distribution by agent',
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
              format: { id: 'date', params: { pattern: 'YYYY-MM-DD HH:mm' } },
              params: {
                date: true,
                interval: 'auto',
                format: 'YYYY-MM-DD HH:mm',
                bounds: { min: '2019-08-15T12:25:44.851Z', max: '2019-08-22T12:25:44.851Z' },
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
            type: 'terms',
            schema: 'segment',
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
            id: '3',
            enabled: true,
            type: 'terms',
            schema: 'group',
            params: {
              field: 'rule.hipaa',
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
    _id: 'Wazuh-App-Overview-HIPAA-Top-requirements-over-time',
    _source: {
      title: 'Requirements evolution over time',
      visState: JSON.stringify({
        title: 'Requirements evolution over time',
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
              format: { id: 'date', params: { pattern: 'YYYY-MM-DD HH:mm' } },
              params: {
                date: true,
                interval: 'auto',
                format: 'YYYY-MM-DD HH:mm',
                bounds: { min: '2019-08-15T12:25:29.501Z', max: '2019-08-22T12:25:29.501Z' },
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
              field: 'rule.hipaa',
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
];
