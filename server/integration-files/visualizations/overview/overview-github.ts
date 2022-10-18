/*
 * Wazuh app - Module for Overview/GitHub visualizations
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
    _id: 'Wazuh-App-Overview-GitHub-Alerts-Evolution-By-Organization',
    _source: {
      title: 'Alerts evolution by organization',
      visState: JSON.stringify({
        title: 'Alerts evolution by organization',
        type: 'area',
        aggs: [
          {
            id: '1',
            enabled: true,
            type: 'count',
            params: {},
            schema: 'metric',
          },
          {
            id: '2',
            enabled: true,
            type: 'date_histogram',
            params: {
              field: 'timestamp',
              timeRange: {
                from: 'now-7d',
                to: 'now',
              },
              useNormalizedEsInterval: true,
              scaleMetricValues: false,
              interval: 'auto',
              drop_partials: false,
              min_doc_count: 1,
              extended_bounds: {},
              customLabel: '',
            },
            schema: 'segment',
          },
          {
            id: '3',
            enabled: true,
            type: 'terms',
            params: {
              field: 'data.github.org',
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
                rotate: 0,
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
              type: 'line',
              mode: 'normal',
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
          orderBucketsBySum: false,
        },
      }),
      uiStateJSON: '',
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
    _id: 'Wazuh-App-Overview-GitHub-Top-5-Organizations-By-Alerts',
    _source: {
      title: 'Top 5 organizations by alerts',
      visState: JSON.stringify({
        title: 'Top 5 organizations by alerts',
        type: 'pie',
        aggs: [
          {
            id: '1',
            enabled: true,
            type: 'count',
            params: {},
            schema: 'metric',
          },
          {
            id: '2',
            enabled: true,
            type: 'terms',
            params: {
              field: 'data.github.org',
              orderBy: '1',
              order: 'desc',
              size: 5,
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
            },
            schema: 'segment',
          },
        ],
        params: {
          type: 'pie',
          addTooltip: true,
          addLegend: true,
          legendPosition: 'right',
          isDonut: false,
          labels: {
            show: false,
            values: true,
            last_level: true,
            truncate: 100,
          },
        },
      }),
      uiStateJSON: '',
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
    _id: 'Wazuh-App-Overview-GitHub-Users-With-More-Alerts',
    _source: {
      title: 'Users with more alerts',
      visState: JSON.stringify({
        title: 'Users with more alerts',
        type: 'line',
        aggs: [
          {
            id: '1',
            enabled: true,
            type: 'count',
            params: {},
            schema: 'metric',
          },
          {
            id: '4',
            enabled: true,
            type: 'terms',
            params: {
              field: 'data.github.org',
              orderBy: '1',
              order: 'desc',
              size: 5,
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
            },
            schema: 'segment',
          },
          {
            id: '3',
            enabled: true,
            type: 'terms',
            params: {
              field: 'data.github.actor',
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
                text: 'Count',
              },
            },
          ],
          seriesParams: [
            {
              show: true,
              type: 'histogram',
              mode: 'stacked',
              data: {
                label: 'Count',
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
        },
      }),
      uiStateJSON: '',
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
    _id: 'Wazuh-App-Overview-GitHub-Alert-Action-Type-By-Organization',
    _source: {
      title: 'Top alerts by alert action type and organization',
      visState: JSON.stringify({
        title: 'Top alerts by alert action type and organization',
        type: 'pie',
        aggs: [
          {
            id: '1',
            enabled: true,
            type: 'count',
            params: {},
            schema: 'metric',
          },
          {
            id: '3',
            enabled: true,
            type: 'terms',
            params: {
              field: 'data.github.org',
              orderBy: '1',
              order: 'desc',
              size: 5,
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
            },
            schema: 'segment',
          },
          {
            id: '2',
            enabled: true,
            type: 'terms',
            params: {
              field: 'data.github.action',
              orderBy: '1',
              order: 'desc',
              size: 3,
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
            },
            schema: 'segment',
          },
        ],
        params: {
          type: 'pie',
          addTooltip: true,
          addLegend: true,
          legendPosition: 'right',
          isDonut: true,
          labels: {
            show: false,
            values: true,
            last_level: true,
            truncate: 100,
          },
        },
      }),
      uiStateJSON: '',
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
    _id: 'Wazuh-App-Overview-GitHub-Alert-Summary',
    _source: {
      title: 'Alerts summary',
      visState: JSON.stringify({
        title: 'Alerts summary',
        type: 'table',
        aggs: [
          {
            id: '1',
            enabled: true,
            type: 'count',
            params: {},
            schema: 'metric',
          },
          {
            id: '2',
            enabled: true,
            type: 'terms',
            params: {
              field: 'agent.name',
              orderBy: '1',
              order: 'desc',
              size: 50,
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
            },
            schema: 'bucket',
          },
          {
            id: '3',
            enabled: true,
            type: 'terms',
            params: {
              field: 'data.github.org',
              orderBy: '1',
              order: 'desc',
              size: 10,
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
            },
            schema: 'bucket',
          },
          {
            id: '4',
            enabled: true,
            type: 'terms',
            params: {
              field: 'rule.description',
              orderBy: '1',
              order: 'desc',
              size: 10,
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
            },
            schema: 'bucket',
          },
        ],
        params: {
          perPage: 10,
          showPartialRows: false,
          showMetricsAtAllLevels: false,
          sort: {
            columnIndex: null,
            direction: null,
          },
          showTotal: false,
          totalFunc: 'sum',
          percentageCol: '',
        },
      }),
      uiStateJSON: JSON.stringify({
        vis: { params: { sort: { columnIndex: 3, direction: 'desc' } } },
      }),
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
    _id: 'Wazuh-App-Overview-GitHub-Top-Ten-Organizations',
    _source: {
      title: 'Top 10 organizations',
      visState: JSON.stringify({
        title: 'Top 10 Organizations',
        type: 'pie',
        aggs: [
          {
            id: '1',
            enabled: true,
            type: 'count',
            params: {},
            schema: 'metric',
          },
          {
            id: '2',
            enabled: true,
            type: 'terms',
            params: {
              field: 'data.github.org',
              orderBy: '1',
              order: 'desc',
              size: 10,
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              customLabel: 'Organizations',
            },
            schema: 'segment',
          },
        ],
        params: {
          type: 'pie',
          addTooltip: true,
          addLegend: true,
          legendPosition: 'right',
          isDonut: true,
          labels: {
            show: false,
            values: true,
            last_level: true,
            truncate: 100,
          },
        },
      }),
      uiStateJSON: JSON.stringify({
        vis: { params: { sort: { columnIndex: 3, direction: 'desc' } } },
      }),
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
    _id: 'Wazuh-App-Overview-GitHub-Countries',
    _source: {
      title: 'Countries',
      visState: JSON.stringify({
        title: 'Top github actors countries',
        type: 'tagcloud',
        aggs: [
          {
            id: '1',
            enabled: true,
            type: 'count',
            params: {},
            schema: 'metric',
          },
          {
            id: '2',
            enabled: true,
            type: 'terms',
            params: {
              field: 'data.github.actor_location.country_code',
              orderBy: '1',
              order: 'desc',
              size: 10,
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              customLabel: 'Top countries ',
            },
            schema: 'segment',
          },
        ],
        params: {
          scale: 'linear',
          orientation: 'single',
          minFontSize: 18,
          maxFontSize: 72,
          showLabel: true,
        },
      }),
      uiStateJSON: JSON.stringify({
        vis: { params: { sort: { columnIndex: 3, direction: 'desc' } } },
      }),
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
    _id: 'Wazuh-App-Overview-GitHub-Top-Events',
    _source: {
      title: 'GitHub top events',
      visState: JSON.stringify({
        title: 'Github Top Events',
        type: 'pie',
        aggs: [
          {
            id: '1',
            enabled: true,
            type: 'count',
            params: {},
            schema: 'metric',
          },
          {
            id: '2',
            enabled: true,
            type: 'terms',
            params: {
              field: 'data.github.action',
              orderBy: '1',
              order: 'desc',
              size: 10,
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              customLabel: 'Github Actions',
            },
            schema: 'segment',
          },
        ],
        params: {
          type: 'pie',
          addTooltip: true,
          addLegend: true,
          legendPosition: 'right',
          isDonut: false,
          labels: {
            show: false,
            values: true,
            last_level: true,
            truncate: 100,
          },
        },
      }),
      uiStateJSON: JSON.stringify({
        vis: { params: { sort: { columnIndex: 3, direction: 'desc' } } },
      }),
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
    _id: 'Wazuh-App-Overview-GitHub-Stats',
    _source: {
      title: 'GitHub Stats',
      visState: JSON.stringify({
        title: 'Github Stats',
        type: 'metric',
        aggs: [
          {
            id: '2',
            enabled: true,
            type: 'count',
            params: {
              customLabel: 'Total Alerts',
            },
            schema: 'metric',
          },
          {
            id: '1',
            enabled: true,
            type: 'top_hits',
            params: {
              field: 'rule.level',
              aggregate: 'concat',
              size: 1,
              sortField: 'rule.level',
              sortOrder: 'desc',
              customLabel: 'Max rule level detected',
            },
            schema: 'metric',
          },
        ],
        params: {
          addTooltip: true,
          addLegend: false,
          type: 'metric',
          metric: {
            percentageMode: false,
            useRanges: false,
            colorSchema: 'Green to Red',
            metricColorMode: 'None',
            colorsRange: [
              {
                from: 0,
                to: 10000,
              },
            ],
            labels: {
              show: true,
            },
            invertColors: false,
            style: {
              bgFill: '#000',
              bgColor: false,
              labelColor: false,
              subText: '',
              fontSize: 60,
            },
          },
        },
      }),
      uiStateJSON: JSON.stringify({
        vis: { params: { sort: { columnIndex: 3, direction: 'desc' } } },
      }),
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
    _id: 'Wazuh-App-Overview-GitHub-Organization-Heatmap',
    _source: {
      title: 'GitHub Organization Heatmap',
      visState: JSON.stringify({
        title: 'GitHub Organization Heatmap',
        type: 'heatmap',
        aggs: [
          {
            id: '1',
            enabled: true,
            type: 'count',
            params: {},
            schema: 'metric',
          },
          {
            id: '2',
            enabled: true,
            type: 'terms',
            params: {
              field: 'data.github.org',
              orderBy: '1',
              order: 'desc',
              size: 10,
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
            },
            schema: 'segment',
          },
          {
            id: '3',
            enabled: true,
            type: 'terms',
            params: {
              field: 'data.github.action',
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
        ],
        params: {
          type: 'heatmap',
          addTooltip: true,
          addLegend: true,
          enableHover: false,
          legendPosition: 'right',
          times: [],
          colorsNumber: 4,
          colorSchema: 'Blues',
          setColorRange: false,
          colorsRange: [],
          invertColors: false,
          percentageMode: false,
          valueAxes: [
            {
              show: false,
              id: 'ValueAxis-1',
              type: 'value',
              scale: {
                type: 'linear',
                defaultYExtents: false,
              },
              labels: {
                show: false,
                rotate: 0,
                overwriteColor: false,
                color: 'black',
              },
            },
          ],
        },
      }),
      uiStateJSON: JSON.stringify({
        vis: { params: { sort: { columnIndex: 3, direction: 'desc' } } },
      }),
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
    _id: 'Wazuh-App-Overview-GitHub-Top-Ten-Organizations',
    _source: {
      title: 'GitHub top 10 organizations',
      visState: JSON.stringify({
        title: 'Top 10 Organizations',
        type: 'pie',
        aggs: [
          {
            id: '1',
            enabled: true,
            type: 'count',
            params: {},
            schema: 'metric',
          },
          {
            id: '2',
            enabled: true,
            type: 'terms',
            params: {
              field: 'data.github.org',
              orderBy: '1',
              order: 'desc',
              size: 10,
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              customLabel: 'Organizations',
            },
            schema: 'segment',
          },
        ],
        params: {
          type: 'pie',
          addTooltip: true,
          addLegend: true,
          legendPosition: 'right',
          isDonut: true,
          labels: {
            show: false,
            values: true,
            last_level: true,
            truncate: 100,
          },
        },
      }),
      uiStateJSON: JSON.stringify({
        vis: { params: { sort: { columnIndex: 3, direction: 'desc' } } },
      }),
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
    _id: 'Wazuh-App-Overview-GitHub-Top-Ten-Actors',
    _source: {
      title: 'Top 10 actors',
      visState: JSON.stringify({
        title: 'Top 10 Actors',
        type: 'pie',
        aggs: [
          {
            id: '1',
            enabled: true,
            type: 'count',
            params: {},
            schema: 'metric',
          },
          {
            id: '2',
            enabled: true,
            type: 'terms',
            params: {
              field: 'data.github.actor',
              orderBy: '1',
              order: 'desc',
              size: 10,
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              customLabel: 'Actors',
            },
            schema: 'segment',
          },
        ],
        params: {
          type: 'pie',
          addTooltip: true,
          addLegend: true,
          legendPosition: 'right',
          isDonut: true,
          labels: {
            show: false,
            values: true,
            last_level: true,
            truncate: 100,
          },
        },
      }),
      uiStateJSON: JSON.stringify({
        vis: { params: { sort: { columnIndex: 3, direction: 'desc' } } },
      }),
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
    _id: 'Wazuh-App-Overview-GitHub-Top-Ten-Repositories',
    _source: {
      title: 'Top 10 repositories',
      visState: JSON.stringify({
        title: 'Top 10 Repositories',
        type: 'pie',
        aggs: [
          {
            id: '1',
            enabled: true,
            type: 'count',
            params: {},
            schema: 'metric',
          },
          {
            id: '2',
            enabled: true,
            type: 'terms',
            params: {
              field: 'data.github.repo',
              orderBy: '1',
              order: 'desc',
              size: 10,
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              customLabel: 'Repositories',
            },
            schema: 'segment',
          },
        ],
        params: {
          type: 'pie',
          addTooltip: true,
          addLegend: true,
          legendPosition: 'right',
          isDonut: true,
          labels: {
            show: false,
            values: true,
            last_level: true,
            truncate: 100,
          },
        },
      }),
      uiStateJSON: JSON.stringify({
        vis: { params: { sort: { columnIndex: 3, direction: 'desc' } } },
      }),
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
    _id: 'Wazuh-App-Overview-GitHub-Top-Ten-Actions',
    _source: {
      title: 'Top 10 actions',
      visState: JSON.stringify({
        title: 'Top 10 Actions',
        type: 'pie',
        aggs: [
          {
            id: '1',
            enabled: true,
            type: 'count',
            params: {},
            schema: 'metric',
          },
          {
            id: '2',
            enabled: true,
            type: 'terms',
            params: {
              field: 'data.github.action',
              orderBy: '1',
              order: 'desc',
              size: 10,
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              customLabel: 'Actions',
            },
            schema: 'segment',
          },
        ],
        params: {
          type: 'pie',
          addTooltip: true,
          addLegend: true,
          legendPosition: 'right',
          isDonut: true,
          labels: {
            show: false,
            values: true,
            last_level: true,
            truncate: 100,
          },
        },
      }),
      uiStateJSON: JSON.stringify({
        vis: { params: { sort: { columnIndex: 3, direction: 'desc' } } },
      }),
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
    _id: 'Wazuh-App-Overview-GitHub-Alert-Level-Evolution',
    _source: {
      title: 'Alert level evolution',
      visState: JSON.stringify({
        title: 'Rule Level Over Time',
        type: 'area',
        aggs: [
          {
            id: '1',
            enabled: true,
            type: 'count',
            params: {},
            schema: 'metric',
          },
          {
            id: '2',
            enabled: true,
            type: 'date_histogram',
            params: {
              field: 'timestamp',
              timeRange: {
                from: 'now-30d',
                to: 'now',
              },
              useNormalizedEsInterval: true,
              scaleMetricValues: false,
              interval: 'd',
              drop_partials: false,
              min_doc_count: 1,
              extended_bounds: {},
            },
            schema: 'segment',
          },
          {
            id: '3',
            enabled: true,
            type: 'terms',
            params: {
              field: 'rule.level',
              orderBy: '1',
              order: 'desc',
              size: 10,
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
            },
            schema: 'group',
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
              interpolate: 'step-after',
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
        },
      }),
      uiStateJSON: JSON.stringify({
        vis: { params: { sort: { columnIndex: 3, direction: 'desc' } } },
      }),
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","filter":[],"query":{"query":"","language":"lucene"}}',
      },
    },
    _type: 'visualization',
  },
];
