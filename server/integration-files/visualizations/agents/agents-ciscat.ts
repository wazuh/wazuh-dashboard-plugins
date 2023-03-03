/*
 * Wazuh app - Module for Agents/CIS-CAT visualizations
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { i18n } from '@kbn/i18n';

export default [
  {
    _id: 'Wazuh-app-Agents-CISCAT-alerts-summary',
    _type: 'visualization',
    _source: {
      title: i18n.translate(
        'wazuh.server.integrationvis.agent.ciscat.Alertssummary',
        {
          defaultMessage: 'Alerts summary',
        },
      ),
      visState: JSON.stringify({
        title: i18n.translate(
          'wazuh.server.integrationvis.agent.ciscat.Alertssummary',
          {
            defaultMessage: 'Alerts summary',
          },
        ),
        type: 'table',
        params: {
          perPage: 10,
          showPartialRows: false,
          showMeticsAtAllLevels: false,
          sort: { columnIndex: 3, direction: 'desc' },
          showTotal: false,
          showToolbar: true,
          totalFunc: 'count',
        },
        aggs: [
          {
            id: '1',
            enabled: true,
            type: 'count',
            schema: 'metric',
            params: {},
          },
          {
            id: '3',
            enabled: true,
            type: 'terms',
            schema: 'bucket',
            params: {
              field: 'data.cis.rule_title',
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              size: 50,
              order: 'desc',
              orderBy: '1',
              customLabel: 'Rule title',
            },
          },
          {
            id: '4',
            enabled: true,
            type: 'terms',
            schema: 'bucket',
            params: {
              field: 'data.cis.group',
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              size: 1,
              order: 'desc',
              orderBy: '1',
              customLabel: 'Group',
            },
          },
          {
            id: '5',
            enabled: true,
            type: 'terms',
            schema: 'bucket',
            params: {
              field: 'data.cis.result',
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              size: 1,
              order: 'desc',
              orderBy: '1',
              customLabel: 'Result',
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
  {
    _id: 'Wazuh-app-Agents-CISCAT-last-scan-not-checked',
    _type: 'visualization',
    _source: {
      title: i18n.translate(
        'wazuh.server.integrationvis.agent.ciscat.Lastchecked',
        {
          defaultMessage: 'Last scan not checked',
        },
      ),
      visState: JSON.stringify({
        title: i18n.translate(
          'wazuh.server.integrationvis.agent.ciscat.Lastchecked',
          {
            defaultMessage: 'Last scan not checked',
          },
        ),
        type: 'table',
        params: {
          perPage: 10,
          showPartialRows: false,
          showMeticsAtAllLevels: false,
          sort: { columnIndex: null, direction: null },
          showTotal: false,
          showToolbar: true,
          totalFunc: 'sum',
        },
        aggs: [
          {
            id: '1',
            enabled: true,
            type: 'max',
            schema: 'metric',
            params: { field: 'timestamp' },
          },
          {
            id: '2',
            enabled: true,
            type: 'terms',
            schema: 'bucket',
            params: {
              field: 'data.cis.notchecked',
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              size: 1,
              order: 'desc',
              orderBy: '1',
            },
          },
        ],
      }),
      uiStateJSON: JSON.stringify({
        vis: { params: { sort: { columnIndex: null, direction: null } } },
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
  {
    _id: 'Wazuh-app-Agents-CISCAT-last-scan-score',
    _type: 'visualization',
    _source: {
      title: i18n.translate(
        'wazuh.server.integrationvis.agent.ciscat.Lastscanscore',
        {
          defaultMessage: 'Last scan score',
        },
      ),
      visState: JSON.stringify({
        title: i18n.translate(
          'wazuh.server.integrationvis.agent.ciscat.Lastscanscore',
          {
            defaultMessage: 'Last scan score',
          },
        ),
        type: 'table',
        params: {
          perPage: 10,
          showPartialRows: false,
          showMeticsAtAllLevels: false,
          sort: { columnIndex: null, direction: null },
          showTotal: false,
          showToolbar: true,
          totalFunc: 'sum',
        },
        aggs: [
          {
            id: '1',
            enabled: true,
            type: 'max',
            schema: 'metric',
            params: { field: 'timestamp' },
          },
          {
            id: '2',
            enabled: true,
            type: 'terms',
            schema: 'bucket',
            params: {
              field: 'data.cis.score',
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              size: 1,
              order: 'desc',
              orderBy: '1',
            },
          },
        ],
      }),
      uiStateJSON: JSON.stringify({
        vis: { params: { sort: { columnIndex: null, direction: null } } },
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
  {
    _id: 'Wazuh-app-Agents-CISCAT-last-scan-pass',
    _type: 'visualization',
    _source: {
      title: i18n.translate(
        'wazuh.server.integrationvis.agent.ciscat.Lastscanpass',
        {
          defaultMessage: 'Last scan pass',
        },
      ),
      visState: JSON.stringify({
        title: i18n.translate(
          'wazuh.server.integrationvis.agent.ciscat.Lastscanpass',
          {
            defaultMessage: 'Last scan pass',
          },
        ),
        type: 'table',
        params: {
          perPage: 10,
          showPartialRows: false,
          showMeticsAtAllLevels: false,
          sort: { columnIndex: null, direction: null },
          showTotal: false,
          showToolbar: true,
          totalFunc: 'sum',
        },
        aggs: [
          {
            id: '1',
            enabled: true,
            type: 'max',
            schema: 'metric',
            params: { field: 'timestamp' },
          },
          {
            id: '2',
            enabled: true,
            type: 'terms',
            schema: 'bucket',
            params: {
              field: 'data.cis.pass',
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              size: 1,
              order: 'desc',
              orderBy: '1',
            },
          },
        ],
      }),
      uiStateJSON: JSON.stringify({
        vis: { params: { sort: { columnIndex: null, direction: null } } },
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
  {
    _id: 'Wazuh-app-Agents-CISCAT-last-scan-fail',
    _type: 'visualization',
    _source: {
      title: i18n.translate(
        'wazuh.server.integrationvis.agent.ciscat.Lastscanfail',
        {
          defaultMessage: 'Last scan fail',
        },
      ),
      visState: JSON.stringify({
        title: i18n.translate(
          'wazuh.server.integrationvis.agent.ciscat.Lastscanfail',
          {
            defaultMessage: 'Last scan fail',
          },
        ),
        type: 'table',
        params: {
          perPage: 10,
          showPartialRows: false,
          showMeticsAtAllLevels: false,
          sort: { columnIndex: null, direction: null },
          showTotal: false,
          showToolbar: true,
          totalFunc: 'sum',
        },
        aggs: [
          {
            id: '1',
            enabled: true,
            type: 'max',
            schema: 'metric',
            params: { field: 'timestamp' },
          },
          {
            id: '2',
            enabled: true,
            type: 'terms',
            schema: 'bucket',
            params: {
              field: 'data.cis.fail',
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              size: 1,
              order: 'desc',
              orderBy: '1',
            },
          },
        ],
      }),
      uiStateJSON: JSON.stringify({
        vis: { params: { sort: { columnIndex: null, direction: null } } },
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
  {
    _id: 'Wazuh-app-Agents-CISCAT-last-scan-timestamp',
    _type: 'visualization',
    _source: {
      title: i18n.translate(
        'wazuh.server.integrationvis.agent.ciscat.timestamp',
        {
          defaultMessage: 'Last scan timestamp',
        },
      ),
      visState: JSON.stringify({
        title: i18n.translate(
          'wazuh.server.integrationvis.agent.ciscat.timestamp',
          {
            defaultMessage: 'Last scan timestamp',
          },
        ),
        type: 'table',
        params: {
          perPage: 10,
          showPartialRows: false,
          showMeticsAtAllLevels: false,
          sort: { columnIndex: null, direction: null },
          showTotal: false,
          showToolbar: true,
          totalFunc: 'sum',
        },
        aggs: [
          {
            id: '1',
            enabled: true,
            type: 'max',
            schema: 'metric',
            params: { field: 'timestamp' },
          },
          {
            id: '2',
            enabled: true,
            type: 'terms',
            schema: 'bucket',
            params: {
              field: 'data.cis.timestamp',
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              size: 1,
              order: 'desc',
              orderBy: '1',
            },
          },
        ],
      }),
      uiStateJSON: JSON.stringify({
        vis: { params: { sort: { columnIndex: null, direction: null } } },
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
  {
    _id: 'Wazuh-app-Agents-CISCAT-last-scan-error',
    _type: 'visualization',
    _source: {
      title: i18n.translate(
        'wazuh.server.integrationvis.agent.ciscat.Lastscanerror',
        {
          defaultMessage: 'Last scan error',
        },
      ),
      visState: JSON.stringify({
        title: i18n.translate(
          'wazuh.server.integrationvis.agent.ciscat.Lastscanerror',
          {
            defaultMessage: 'Last scan error',
          },
        ),
        type: 'table',
        params: {
          perPage: 10,
          showPartialRows: false,
          showMeticsAtAllLevels: false,
          sort: { columnIndex: null, direction: null },
          showTotal: false,
          showToolbar: true,
          totalFunc: 'sum',
        },
        aggs: [
          {
            id: '1',
            enabled: true,
            type: 'max',
            schema: 'metric',
            params: { field: 'timestamp' },
          },
          {
            id: '2',
            enabled: true,
            type: 'terms',
            schema: 'bucket',
            params: {
              field: 'data.cis.error',
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              size: 1,
              order: 'desc',
              orderBy: '1',
            },
          },
        ],
      }),
      uiStateJSON: JSON.stringify({
        vis: { params: { sort: { columnIndex: null, direction: null } } },
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
  {
    _id: 'Wazuh-app-Agents-CISCAT-last-scan-benchmark',
    _type: 'visualization',
    _source: {
      title: i18n.translate(
        'wazuh.server.integrationvis.agent.ciscat.Lastscanbenchmark',
        {
          defaultMessage: 'Last scan benchmark',
        },
      ),
      visState: JSON.stringify({
        title: i18n.translate(
          'wazuh.server.integrationvis.agent.ciscat.Lastscanbenchmark',
          {
            defaultMessage: 'Last scan benchmark',
          },
        ),
        type: 'table',
        params: {
          perPage: 10,
          showPartialRows: false,
          showMeticsAtAllLevels: false,
          sort: { columnIndex: null, direction: null },
          showTotal: false,
          showToolbar: true,
          totalFunc: 'sum',
        },
        aggs: [
          {
            id: '1',
            enabled: true,
            type: 'max',
            schema: 'metric',
            params: { field: 'timestamp' },
          },
          {
            id: '2',
            enabled: true,
            type: 'terms',
            schema: 'bucket',
            params: {
              field: 'data.cis.benchmark',
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              size: 1,
              order: 'desc',
              orderBy: '1',
            },
          },
        ],
      }),
      uiStateJSON: JSON.stringify({
        vis: { params: { sort: { columnIndex: null, direction: null } } },
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
  {
    _id: 'Wazuh-app-Agents-CISCAT-last-scan-unknown',
    _type: 'visualization',
    _source: {
      title: i18n.translate(
        'wazuh.server.integrationvis.agent.ciscat.Lastscanunknown',
        {
          defaultMessage: 'Last scan unknown',
        },
      ),
      visState: JSON.stringify({
        title: i18n.translate(
          'wazuh.server.integrationvis.agent.ciscat.Lastscanunknown',
          {
            defaultMessage: 'Last scan unknown',
          },
        ),
        type: 'table',
        params: {
          perPage: 10,
          showPartialRows: false,
          showMeticsAtAllLevels: false,
          sort: { columnIndex: null, direction: null },
          showTotal: false,
          showToolbar: true,
          totalFunc: 'sum',
        },
        aggs: [
          {
            id: '1',
            enabled: true,
            type: 'max',
            schema: 'metric',
            params: { field: 'timestamp' },
          },
          {
            id: '2',
            enabled: true,
            type: 'terms',
            schema: 'bucket',
            params: {
              field: 'data.cis.unknown',
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              size: 1,
              order: 'desc',
              orderBy: '1',
            },
          },
        ],
      }),
      uiStateJSON: JSON.stringify({
        vis: { params: { sort: { columnIndex: null, direction: null } } },
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
  {
    _id: 'Wazuh-app-Agents-CISCAT-top-5-groups',
    _type: 'visualization',
    _source: {
      title: i18n.translate(
        'wazuh.server.integrationvis.agent.ciscat.Top5groups',
        {
          defaultMessage: 'Top 5 groups',
        },
      ),
      visState: JSON.stringify({
        title: i18n.translate(
          'wazuh.server.integrationvis.agent.ciscat.Top5groups',
          {
            defaultMessage: 'Top 5 groups',
          },
        ),
        type: 'histogram',
        params: {
          type: 'histogram',
          grid: {
            categoryLines: false,
            style: { color: '#eee' },
            valueAxis: null,
          },
          categoryAxes: [
            {
              id: 'CategoryAxis-1',
              type: 'category',
              position: 'bottom',
              show: true,
              style: {},
              scale: { type: 'linear' },
              labels: { show: true, truncate: 25, filter: true, rotate: 0 },
              title: {},
            },
          ],
          valueAxes: [
            {
              id: 'ValueAxis-1',
              name: i18n.translate(
                'wazuh.server.integrationvis.agent.ciscat.LeftAxis-1',
                {
                  defaultMessage: 'LeftAxis-1',
                },
              ),
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
          {
            id: '1',
            enabled: true,
            type: 'count',
            schema: 'metric',
            params: {},
          },
          {
            id: '2',
            enabled: true,
            type: 'terms',
            schema: 'segment',
            params: {
              field: 'data.cis.group',
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              size: 5,
              order: 'desc',
              orderBy: '1',
              customLabel: 'Group',
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
  },
  {
    _id: 'Wazuh-app-Agents-CISCAT-scan-result-evolution',
    _type: 'visualization',
    _source: {
      title: i18n.translate(
        'wazuh.server.integrationvis.agent.ciscat.Scanresultevolution',
        {
          defaultMessage: 'Scan result evolution',
        },
      ),
      visState: JSON.stringify({
        title: i18n.translate(
          'wazuh.server.integrationvis.agent.ciscat.Scanresultevolution',
          {
            defaultMessage: 'Scan result evolution',
          },
        ),
        type: 'line',
        params: {
          type: 'line',
          grid: { categoryLines: false, style: { color: '#eee' } },
          categoryAxes: [
            {
              id: 'CategoryAxis-1',
              type: 'category',
              position: 'bottom',
              show: true,
              style: {},
              scale: { type: 'linear' },
              labels: { show: true, truncate: 100, filter: true, rotate: 0 },
              title: {},
            },
          ],
          valueAxes: [
            {
              id: 'ValueAxis-1',
              name: i18n.translate(
                'wazuh.server.integrationvis.agent.ciscat.LeftAxis-1',
                {
                  defaultMessage: 'LeftAxis-1',
                },
              ),
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
            },
          ],
          addTooltip: true,
          addLegend: true,
          legendPosition: 'right',
          times: [],
          addTimeMarker: false,
        },
        aggs: [
          {
            id: '1',
            enabled: true,
            type: 'count',
            schema: 'metric',
            params: {},
          },
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
          {
            id: '3',
            enabled: true,
            type: 'terms',
            schema: 'group',
            params: {
              field: 'data.cis.result',
              otherBucket: false,
              otherBucketLabel: 'Other',
              missingBucket: false,
              missingBucketLabel: 'Missing',
              size: 5,
              order: 'desc',
              orderBy: '1',
              customLabel: 'Result',
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
  },
];
