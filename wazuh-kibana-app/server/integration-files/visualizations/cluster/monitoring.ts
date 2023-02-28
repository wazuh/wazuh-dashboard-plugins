/*
 * Wazuh app - Cluster monitoring visualizations
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
    _id: 'Wazuh-App-Cluster-monitoring-Overview',
    _type: 'visualization',
    _source: {
      title: 'Wazuh App Cluster Overview',
      visState: JSON.stringify({
        title: 'Wazuh App Cluster Overview',
        type: 'timelion',
        params: { expression: '.es(*)', interval: 'auto' },
        aggs: [],
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
    _id: 'Wazuh-App-Cluster-monitoring-Overview-Manager',
    _type: 'visualization',
    _source: {
      title: 'Wazuh App Cluster Overview Manager',
      visState: JSON.stringify({
        title: 'Wazuh App Cluster Overview Manager',
        type: 'timelion',
        params: { expression: '.es(q=agent.id:000)', interval: 'auto' },
        aggs: [],
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
    _id: 'Wazuh-App-Cluster-monitoring-Overview-Node',
    _source: {
      title: 'Wazuh App Cluster Overview Node',
      visState: JSON.stringify({
        title: 'Wazuh App Cluster Overview Node',
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
            },
          },
        ],
      }),
      uiStateJSON: JSON.stringify({
        spy: { mode: { name: null, fill: false } },
        vis: { legendOpen: false },
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
    _id: 'Wazuh-App-Cluster-monitoring-Overview-Node-Pie',
    _type: 'visualization',
    _source: {
      title: 'Wazuh App Cluster Overview Node Pie',
      visState: JSON.stringify({
        title: 'Wazuh App Cluster Overview Node Pie',
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
              field: 'cluster.node',
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              size: 5,
              order: 'desc',
              orderBy: '1',
            },
          },
        ],
      }),
      uiStateJSON: JSON.stringify({ spy: { mode: { name: 'table' } } }),
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
