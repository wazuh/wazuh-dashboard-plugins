/*
 * Wazuh app - Module for Agents/GDPR visualizations
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
    _id: 'Wazuh-App-Agents-GDPR-Groups',
    _source: {
      title: 'Top 5 rule groups',
      visState: JSON.stringify({
        title: 'Top 5 rule groups',
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
            params: { field: 'rule.groups', size: 5, order: 'desc', orderBy: '1' },
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
    _id: 'Wazuh-App-Agents-GDPR-Rule',
    _source: {
      title: 'Top 5 rules',
      visState: JSON.stringify({
        title: 'Top 5 rules',
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
            params: { field: 'rule.description', size: 5, order: 'desc', orderBy: '1' },
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
    _id: 'Wazuh-App-Agents-GDPR-Requirement',
    _source: {
      title: 'Top 5 requirements',
      visState: JSON.stringify({
        title: 'Top 5 requirements',
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
            params: { field: 'rule.gdpr', size: 5, order: 'desc', orderBy: '1' },
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
    _id: 'Wazuh-App-Agents-GDPR-Rule-level-distribution',
    _source: {
      title: 'Rule level distribution',
      visState: JSON.stringify({
        title: 'Rule level distribution',
        type: 'pie',
        params: {
          type: 'pie',
          addTooltip: true,
          addLegend: false,
          legendPosition: 'right',
          isDonut: true,
          labels: { show: true, values: true, last_level: true, truncate: 100 },
        },
        aggs: [
          { id: '1', enabled: true, type: 'count', schema: 'metric', params: {} },
          {
            id: '2',
            enabled: true,
            type: 'terms',
            schema: 'segment',
            params: {
              field: 'rule.level',
              size: 15,
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
    _id: 'Wazuh-App-Agents-GDPR-Requirements',
    _source: {
      title: 'Requirements',
      visState: JSON.stringify({
        title: 'Requirements',
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
              labels: { show: true, filter:true,truncate: 100, rotate: 0 },
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
            params: { field: 'rule.gdpr', size: 5, order: 'desc', orderBy: '1', customLabel: '' },
          },
          {
            id: '2',
            enabled: true,
            type: 'terms',
            schema: 'segment',
            params: {
              field: 'rule.gdpr',
              size: 10,
              order: 'desc',
              orderBy: '1',
              customLabel: 'GDPR requirements',
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
    _id: 'Wazuh-App-Agents-GDPR-Last-alerts',
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
              field: 'rule.gdpr',
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              size: 50,
              order: 'desc',
              orderBy: '1',
              customLabel: 'Requirement',
            },
          },
          {
            id: '4',
            enabled: true,
            type: 'terms',
            schema: 'bucket',
            params: {
              field: 'rule.description',
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              size: 10,
              order: 'desc',
              orderBy: '1',
              customLabel: 'Rule description',
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
