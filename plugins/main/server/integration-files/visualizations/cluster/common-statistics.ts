export const commonStatisticsByNode = (isClusterMode: boolean) => {
  const idNodeText = isClusterMode ? '-By-Node' : '';
  const titleNodeText = isClusterMode ? ' by Node' : '';
  const labelNodeText = isClusterMode ? ' by Node:' : '';

  return [
    {
      _id: 'Wazuh-App-Statistics-Analysisd-Events' + idNodeText,
      _type: 'visualization',
      _source: {
        title: 'Wazuh App Statistics Events' + titleNodeText,
        visState: JSON.stringify({
          title: 'Wazuh App Statistics Events' + titleNodeText,
          type: 'line',
          aggs: [
            {
              id: '1',
              enabled: true,
              type: 'sum',
              params: {
                field: 'analysisd.events_processed',
                customLabel: 'Count',
              },
              schema: 'metric',
            },
            {
              id: '2',
              enabled: true,
              type: 'date_histogram',
              params: {
                field: 'timestamp',
                timeRange: {
                  from: 'now-30m',
                  to: 'now',
                },
                useNormalizedOpenSearchInterval: true,
                scaleMetricValues: false,
                interval: 'auto',
                drop_partials: false,
                min_doc_count: 1,
                extended_bounds: {},
                customLabel: 'timestamp',
              },
              schema: 'segment',
            },
            {
              id: '4',
              enabled: true,
              type: 'filters',
              params: {
                filters: [
                  {
                    input: {
                      query: 'analysisd.events_processed:*',
                      language: 'kuery',
                    },
                    label: 'Events processed' + labelNodeText,
                  },
                ],
              },
              schema: 'group',
            },
            isClusterMode
              ? {
                  id: '3',
                  enabled: true,
                  type: 'terms',
                  params: {
                    field: 'nodeName.keyword',
                    orderBy: '1',
                    order: 'desc',
                    size: 5,
                    otherBucket: false,
                    otherBucketLabel: 'Other',
                    missingBucket: false,
                    missingBucketLabel: 'Missing',
                    customLabel: '',
                  },
                  schema: 'group',
                }
              : {},
          ],
          params: {
            type: 'line',
            grid: {
              categoryLines: true,
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
                type: 'line',
                mode: 'normal',
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
        description: '',
        version: 1,
        kibanaSavedObjectMeta: {
          searchSourceJSON: JSON.stringify({
            index: 'wazuh-statistics-*',
            filter: [],
            query: { query: '', language: 'lucene' },
          }),
        },
      },
    },
    {
      _id: 'Wazuh-App-Statistics-Analysisd-Events-Dropped' + idNodeText,
      _type: 'visualization',
      _source: {
        title: 'Wazuh App Statistics Events Dropped' + titleNodeText,
        visState: JSON.stringify({
          title: 'Wazuh App Statistics Events Dropped' + titleNodeText,
          type: 'line',
          aggs: [
            {
              id: '1',
              enabled: true,
              type: 'sum',
              params: {
                field: 'analysisd.events_dropped',
                customLabel: 'Count',
              },
              schema: 'metric',
            },
            {
              id: '2',
              enabled: true,
              type: 'date_histogram',
              params: {
                field: 'timestamp',
                timeRange: {
                  from: 'now-30m',
                  to: 'now',
                },
                useNormalizedOpenSearchInterval: true,
                scaleMetricValues: false,
                interval: 'auto',
                drop_partials: false,
                min_doc_count: 1,
                extended_bounds: {},
                customLabel: 'timestamp',
              },
              schema: 'segment',
            },
            {
              id: '3',
              enabled: true,
              type: 'filters',
              params: {
                filters: [
                  {
                    input: {
                      query: 'analysisd.events_dropped:*',
                      language: 'kuery',
                    },
                    label: 'Events dropped' + labelNodeText,
                  },
                ],
              },
              schema: 'group',
            },
            isClusterMode
              ? {
                  id: '4',
                  enabled: true,
                  type: 'terms',
                  params: {
                    field: 'nodeName.keyword',
                    orderBy: '1',
                    order: 'desc',
                    size: 5,
                    otherBucket: false,
                    otherBucketLabel: 'Other',
                    missingBucket: false,
                    missingBucketLabel: 'Missing',
                  },
                  schema: 'group',
                }
              : {},
          ],
          params: {
            type: 'line',
            grid: {
              categoryLines: true,
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
                type: 'line',
                mode: 'normal',
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
        description: '',
        version: 1,
        kibanaSavedObjectMeta: {
          searchSourceJSON: JSON.stringify({
            index: 'wazuh-statistics-*',
            filter: [],
            query: { query: '', language: 'lucene' },
          }),
        },
      },
    },
  ];
};
