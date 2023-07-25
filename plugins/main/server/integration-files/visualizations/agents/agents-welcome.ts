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
    _id: 'Wazuh-App-Agents-Welcome-Top-PCI',
    _type: 'visualization',
    _source: {
      title: 'Top 5 rules',
      visState: JSON.stringify({
        title: 'top pci requirements',
        type: 'pie',
        params: {
          type: 'pie',
          addTooltip: true,
          addLegend: true,
          legendPosition: 'right',
          isDonut: true,
          labels: { show: false, values: true, last_level: true, truncate: 100 },
          dimensions: {
            metric: {
              accessor: 1,
              format: { id: 'number' },
              params: {},
              label: 'Count',
              aggType: 'count',
            },
            buckets: [
              {
                accessor: 0,
                format: {
                  id: 'terms',
                  params: {
                    id: 'string',
                    otherBucketLabel: 'Other',
                    missingBucketLabel: 'Missing',
                    parsedUrl: {
                      origin: 'http://172.16.1.2:5601',
                      pathname: '/app/kibana',
                      basePath: '',
                    },
                  },
                },
                params: {},
                label: 'Requirement',
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
              field: 'rule.pci_dss',
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
    _id: 'Wazuh-App-Agents-Welcome-Top-GDPR',
    _type: 'visualization',
    _source: {
      title: 'Top 5 GDPR',
      visState: JSON.stringify({
        title: 'top gdpr requirements',
        type: 'pie',
        params: {
          type: 'pie',
          addTooltip: true,
          addLegend: true,
          legendPosition: 'right',
          isDonut: true,
          labels: { show: false, values: true, last_level: true, truncate: 100 },
          dimensions: {
            metric: {
              accessor: 1,
              format: { id: 'number' },
              params: {},
              label: 'Count',
              aggType: 'count',
            },
            buckets: [
              {
                accessor: 0,
                format: {
                  id: 'terms',
                  params: {
                    id: 'string',
                    otherBucketLabel: 'Other',
                    missingBucketLabel: 'Missing',
                    parsedUrl: {
                      origin: 'http://172.16.1.2:5601',
                      pathname: '/app/kibana',
                      basePath: '',
                    },
                  },
                },
                params: {},
                label: 'Requirement',
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
              field: 'rule.gdpr',
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
    _id: 'Wazuh-App-Agents-Welcome-Top-HIPAA',
    _type: 'visualization',
    _source: {
      title: 'Top 5 HIPAA',
      visState: JSON.stringify({
        title: 'top hipaa requirements',
        type: 'pie',
        params: {
          type: 'pie',
          addTooltip: true,
          addLegend: true,
          legendPosition: 'right',
          isDonut: true,
          labels: { show: false, values: true, last_level: true, truncate: 100 },
          dimensions: {
            metric: {
              accessor: 1,
              format: { id: 'number' },
              params: {},
              label: 'Count',
              aggType: 'count',
            },
            buckets: [
              {
                accessor: 0,
                format: {
                  id: 'terms',
                  params: {
                    id: 'string',
                    otherBucketLabel: 'Other',
                    missingBucketLabel: 'Missing',
                    parsedUrl: {
                      origin: 'http://172.16.1.2:5601',
                      pathname: '/app/kibana',
                      basePath: '',
                    },
                  },
                },
                params: {},
                label: 'Requirement',
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
    _id: 'Wazuh-App-Agents-Welcome-Top-NIST-800-53',
    _type: 'visualization',
    _source: {
      title: 'Top 5 NIST-800-53',
      visState: JSON.stringify({
        title: 'top NIST-800-53 requirements',
        type: 'pie',
        params: {
          type: 'pie',
          addTooltip: true,
          addLegend: true,
          legendPosition: 'right',
          isDonut: true,
          labels: { show: false, values: true, last_level: true, truncate: 100 },
          dimensions: {
            metric: {
              accessor: 1,
              format: { id: 'number' },
              params: {},
              label: 'Count',
              aggType: 'count',
            },
            buckets: [
              {
                accessor: 0,
                format: {
                  id: 'terms',
                  params: {
                    id: 'string',
                    otherBucketLabel: 'Other',
                    missingBucketLabel: 'Missing',
                    parsedUrl: {
                      origin: 'http://172.16.1.2:5601',
                      pathname: '/app/kibana',
                      basePath: '',
                    },
                  },
                },
                params: {},
                label: 'Requirement',
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
    _id: 'Wazuh-App-Agents-Welcome-Top-GPG-13',
    _type: 'visualization',
    _source: {
      title: 'Top 5 GPG-13',
      visState: JSON.stringify({
        title: 'top GPG-13 requirements',
        type: 'pie',
        params: {
          type: 'pie',
          addTooltip: true,
          addLegend: true,
          legendPosition: 'right',
          isDonut: true,
          labels: { show: false, values: true, last_level: true, truncate: 100 },
          dimensions: {
            metric: {
              accessor: 1,
              format: { id: 'number' },
              params: {},
              label: 'Count',
              aggType: 'count',
            },
            buckets: [
              {
                accessor: 0,
                format: {
                  id: 'terms',
                  params: {
                    id: 'string',
                    otherBucketLabel: 'Other',
                    missingBucketLabel: 'Missing',
                    parsedUrl: {
                      origin: 'http://172.16.1.2:5601',
                      pathname: '/app/kibana',
                      basePath: '',
                    },
                  },
                },
                params: {},
                label: 'Requirement',
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
              field: 'rule.gpg13',
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
    _id: 'Wazuh-App-Agents-Welcome-Top-TSC',
    _type: 'visualization',
    _source: {
      title: 'Top 5 TSC',
      visState: JSON.stringify({
        title: 'top TSC requirements',
        type: 'pie',
        params: {
          type: 'pie',
          addTooltip: true,
          addLegend: true,
          legendPosition: 'right',
          isDonut: true,
          labels: { show: false, values: true, last_level: true, truncate: 100 },
          dimensions: {
            metric: {
              accessor: 1,
              format: { id: 'number' },
              params: {},
              label: 'Count',
              aggType: 'count',
            },
            buckets: [
              {
                accessor: 0,
                format: {
                  id: 'terms',
                  params: {
                    id: 'string',
                    otherBucketLabel: 'Other',
                    missingBucketLabel: 'Missing',
                    parsedUrl: {
                      origin: 'http://172.16.1.2:5601',
                      pathname: '/app/kibana',
                      basePath: '',
                    },
                  },
                },
                params: {},
                label: 'Requirement',
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
              field: 'rule.tsc',
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
    _id: 'Wazuh-App-Agents-Welcome-Events-Evolution',
    _type: 'visualization',
    _source: {
      title: 'Events evolution',
      visState: JSON.stringify({
        title: 'event evolution',
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
              show: true,
              type: 'line',
              mode: 'normal',
              data: { label: 'Count', id: '1' },
              valueAxis: 'ValueAxis-1',
              drawLinesBetweenPoints: true,
              lineWidth: 2,
              interpolate: 'linear',
              showCircles: true,
            },
          ],
          addTooltip: true,
          addLegend: false,
          legendPosition: 'right',
          times: [],
          addTimeMarker: false,
          labels: {},
          thresholdLine: { show: false, value: 10, width: 1, style: 'full', color: '#E7664C' },
          dimensions: {
            x: null,
            y: [
              {
                accessor: 0,
                format: { id: 'number' },
                params: {},
                label: 'Count',
                aggType: 'count',
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
              useNormalizedEsInterval: true,
              scaleMetricValues: false,
              interval: 'auto',
              drop_partials: false,
              min_doc_count: 1,
              extended_bounds: {},
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
];
