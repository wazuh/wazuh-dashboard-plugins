/*
 * Wazuh app - Module for Overview/GDPR visualizations
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
    _id: 'Wazuh-App-Overview-SCA-Alert',
    _type: 'visualization',
    _source: {
      title: 'Alerts',
      visState: JSON.stringify({
        title: 'Alerts sca',
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
            type: 'date_histogram',
            params: {
              field: 'timestamp',
              timeRange: {
                from: 'now-4M',
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
              field: 'data.sca.check.title',
              orderBy: '1',
              order: 'desc',
              size: 5,
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              customLabel: 'data.sca.check.title',
            },
            schema: 'bucket',
          },
          {
            id: '4',
            enabled: false,
            type: 'terms',
            params: {
              field: 'data.sca.check.file',
              orderBy: '1',
              order: 'desc',
              size: 5,
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              customLabel: 'data.sca.check.file',
            },
            schema: 'bucket',
          },
          {
            id: '5',
            enabled: true,
            type: 'terms',
            params: {
              field: 'data.sca.policy',
              orderBy: '1',
              order: 'desc',
              size: 5,
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              customLabel: 'data.sca.policy',
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
          query: {
            language: 'kuery',
            query: '', // Deja este campo vacío para que los usuarios puedan ingresar sus consultas
          },
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
];
