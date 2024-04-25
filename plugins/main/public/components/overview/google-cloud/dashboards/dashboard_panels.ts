import { DashboardPanelState } from '../../../../../../../../src/plugins/dashboard/public/application';
import { EmbeddableInput } from '../../../../../../../../src/plugins/embeddable/public';

const getVisStateEventsOverTime = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Overview-GCP-Alerts-Evolution-By-AuthAnswer',
    title: 'Events over time by auth answer',
    type: 'area',
    params: {
      type: 'area',
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
          type: 'area',
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
      thresholdLine: {
        show: false,
        value: 10,
        width: 1,
        style: 'full',
        color: '#34130C',
      },
      labels: {},
      dimensions: {
        x: null,
        y: [
          {
            accessor: 0,
            format: { id: 'number' },
            params: {},
            aggType: 'count',
          },
        ],
      },
    },
    data: {
      searchSource: {
        query: {
          language: 'kuery',
          query: '',
        },
        filter: [],
        index: indexPatternId,
      },
      references: [
        {
          name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
          type: 'index-pattern',
          id: indexPatternId,
        },
      ],
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
            field: 'data.gcp.jsonPayload.authAnswer',
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
    },
  };
};

const getVisStateTopResponseCode = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Overview-GCP-Top-vmInstances-By-ResponseCode',
    title: 'Top instances by response code',
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
    },
    uiState: {
      vis: {
        legendOpen: false,
      },
    },
    data: {
      searchSource: {
        query: {
          language: 'kuery',
          query: '',
        },
        filter: [],
        index: indexPatternId,
      },
      references: [
        {
          name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
          type: 'index-pattern',
          id: indexPatternId,
        },
      ],
      aggs: [
        { id: '1', enabled: true, type: 'count', schema: 'metric', params: {} },
        {
          id: '2',
          enabled: true,
          type: 'terms',
          schema: 'segment',
          params: {
            field: 'data.gcp.jsonPayload.vmInstanceName',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: 'VM Instance Name',
          },
        },
        {
          id: '3',
          enabled: true,
          type: 'terms',
          schema: 'segment',
          params: {
            field: 'data.gcp.jsonPayload.responseCode',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: 'Response Code',
          },
        },
      ],
    },
  };
};

const getVisStateTopResourceTypeProject = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Overview-GCP-Top-ResourceType-By-Project-Id',
    title: 'Resource type by project id',
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
            params: {
              id: 'string',
              otherBucketLabel: 'Other',
              missingBucketLabel: 'Missing',
            },
          },
          params: {},
          aggType: 'terms',
        },
        y: [
          {
            accessor: 2,
            format: { id: 'number' },
            params: {},
            aggType: 'count',
          },
        ],
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
    data: {
      searchSource: {
        query: {
          language: 'kuery',
          query: '',
        },
        filter: [],
        index: indexPatternId,
      },
      references: [
        {
          name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
          type: 'index-pattern',
          id: indexPatternId,
        },
      ],
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
    },
  };
};

const getVisStateTopProjectIdBySource = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Overview-GCP-Top-ProjectId-By-SourceType',
    title: 'Top project id by sourcetype',
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
    data: {
      searchSource: {
        query: {
          language: 'kuery',
          query: '',
        },
        filter: [],
        index: indexPatternId,
      },
      references: [
        {
          name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
          type: 'index-pattern',
          id: indexPatternId,
        },
      ],
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
    },
  };
};

const getVisStateTop5Map = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Overview-GCP-Map-By-SourceIp',
    title: 'Top 5 Map by source ip',
    type: 'tile_map',
    params: {
      colorSchema: 'Green to Red',
      mapType: 'Scaled Circle Markers',
      isDesaturated: false,
      addTooltip: true,
      heatClusterSize: 1.5,
      legendPosition: 'bottomright',
      mapZoom: 2,
      mapCenter: [0, 0],
      wms: {
        enabled: false,
        options: { format: 'image/png', transparent: true },
      },
      dimensions: {
        metric: {
          accessor: 2,
          format: { id: 'number' },
          params: {},
          aggType: 'count',
        },
        geohash: {
          accessor: 1,
          format: { id: 'string' },
          params: { precision: 2, useGeocentroid: true },
          aggType: 'geohash_grid',
        },
        geocentroid: {
          accessor: 3,
          format: { id: 'string' },
          params: {},
          aggType: 'geo_centroid',
        },
      },
    },
    data: {
      searchSource: {
        query: {
          language: 'kuery',
          query: '',
        },
        filter: [],
        index: indexPatternId,
      },
      references: [
        {
          name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
          type: 'index-pattern',
          id: indexPatternId,
        },
      ],
      aggs: [
        { id: '1', enabled: true, type: 'count', schema: 'metric', params: {} },
        {
          id: '2',
          enabled: true,
          type: 'geohash_grid',
          schema: 'segment',
          params: {
            field: 'GeoLocation.location',
            autoPrecision: true,
            precision: 2,
            useGeocentroid: true,
            isFilteredByCollar: true,
            mapZoom: 3,
            mapCenter: { lon: 1.3183593750000002, lat: 18.06231230454674 },
            mapBounds: {
              bottom_right: {
                lat: -50.736455137010644,
                lon: 125.68359375000001,
              },
              top_left: { lat: 68.72044056989829, lon: -123.04687500000001 },
            },
          },
        },
      ],
    },
  };
};

const getVisStateTop5Rules = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Agents-GCP-Top-5-rules',
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
    data: {
      searchSource: {
        query: {
          language: 'kuery',
          query: '',
        },
        filter: [],
        index: indexPatternId,
      },
      references: [
        {
          name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
          type: 'index-pattern',
          id: indexPatternId,
        },
      ],
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
    },
  };
};

const getVisStateTopQueryEvents = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Agents-GCP-Event-Query-Name',
    title: 'Top query events',
    type: 'pie',
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
      dimensions: {
        metric: {
          accessor: 1,
          format: { id: 'number' },
          params: {},
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
              },
            },
            params: {},
            aggType: 'terms',
          },
        ],
      },
    },
    data: {
      searchSource: {
        query: {
          language: 'kuery',
          query: '',
        },
        filter: [],
        index: indexPatternId,
      },
      references: [
        {
          name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
          type: 'index-pattern',
          id: indexPatternId,
        },
      ],
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
    },
  };
};

const getVisStateTop5Instances = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Agents-GCP-Top-5-instances',
    title: 'Top 5 instances',
    type: 'pie',
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
      dimensions: {
        metric: {
          accessor: 1,
          format: { id: 'number' },
          params: {},
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
              },
            },
            params: {},
            aggType: 'terms',
          },
        ],
      },
    },
    data: {
      searchSource: {
        query: {
          language: 'kuery',
          query: '',
        },
        filter: [],
        index: indexPatternId,
      },
      references: [
        {
          name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
          type: 'index-pattern',
          id: indexPatternId,
        },
      ],
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
    },
  };
};

const getVisStateGCPAlerts = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Agents-GCP-Events-Over-Time',
    title: 'GCP alerts evolution',
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
      thresholdLine: {
        show: false,
        value: 10,
        width: 1,
        style: 'full',
        color: '#34130C',
      },
      labels: {},
      dimensions: {
        x: {
          accessor: 0,
          format: { id: 'date', params: { pattern: 'YYYY-MM-DD' } },
          params: {
            date: true,
            interval: 'P1D',
            format: 'YYYY-MM-DD',
            bounds: {
              min: '2019-09-07T14:30:14.047Z',
              max: '2019-11-07T14:19:07.505Z',
            },
          },
          aggType: 'date_histogram',
        },
        y: [
          {
            accessor: 1,
            format: { id: 'number' },
            params: {},
            aggType: 'count',
          },
        ],
      },
    },
    data: {
      searchSource: {
        query: {
          language: 'kuery',
          query: '',
        },
        filter: [],
        index: indexPatternId,
      },
      references: [
        {
          name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
          type: 'index-pattern',
          id: indexPatternId,
        },
      ],
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
    },
  };
};

const getVisStateGCPAuthAnswer = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Agents-GCP-authAnswer-Bar',
    title: 'Auth answer count',
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
      thresholdLine: {
        show: false,
        value: 10,
        width: 1,
        style: 'full',
        color: '#34130C',
      },
      dimensions: {
        x: {
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
        y: [
          {
            accessor: 1,
            format: { id: 'number' },
            params: {},
            aggType: 'count',
          },
        ],
      },
    },
    data: {
      searchSource: {
        query: {
          language: 'kuery',
          query: '',
        },
        filter: [],
        index: indexPatternId,
      },
      references: [
        {
          name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
          type: 'index-pattern',
          id: indexPatternId,
        },
      ],
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
    },
  };
};

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent: boolean,
): {
  [panelId: string]: DashboardPanelState<
    EmbeddableInput & { [k: string]: unknown }
  >;
} => {
  const overviewPanels = {
    '1': {
      gridData: {
        w: 48,
        h: 9,
        x: 0,
        y: 0,
        i: '1',
      },
      type: 'visualization',
      explicitInput: {
        id: '1',
        savedVis: getVisStateEventsOverTime(indexPatternId),
      },
    },
    '2': {
      gridData: {
        w: 13,
        h: 9,
        x: 0,
        y: 9,
        i: '2',
      },
      type: 'visualization',
      explicitInput: {
        id: '2',
        savedVis: getVisStateTopResponseCode(indexPatternId),
      },
    },
    '3': {
      gridData: {
        w: 22,
        h: 9,
        x: 13,
        y: 9,
        i: '3',
      },
      type: 'visualization',
      explicitInput: {
        id: '3',
        savedVis: getVisStateTopResourceTypeProject(indexPatternId),
      },
    },
    '4': {
      gridData: {
        w: 13,
        h: 9,
        x: 35,
        y: 9,
        i: '4',
      },
      type: 'visualization',
      explicitInput: {
        id: '4',
        savedVis: getVisStateTopProjectIdBySource(indexPatternId),
      },
    },
    '5': {
      gridData: {
        w: 48,
        h: 15,
        x: 0,
        y: 18,
        i: '5',
      },
      type: 'visualization',
      explicitInput: {
        id: '5',
        savedVis: getVisStateTop5Map(indexPatternId),
      },
    },
  };
  const agentsPanels = {
    '6': {
      gridData: {
        w: 24,
        h: 10,
        x: 0,
        y: 0,
        i: '6',
      },
      type: 'visualization',
      explicitInput: {
        id: '6',
        savedVis: getVisStateTop5Rules(indexPatternId),
      },
    },
    '7': {
      gridData: {
        w: 12,
        h: 10,
        x: 24,
        y: 0,
        i: '7',
      },
      type: 'visualization',
      explicitInput: {
        id: '7',
        savedVis: getVisStateTopQueryEvents(indexPatternId),
      },
    },
    '8': {
      gridData: {
        w: 12,
        h: 10,
        x: 36,
        y: 0,
        i: '8',
      },
      type: 'visualization',
      explicitInput: {
        id: '8',
        savedVis: getVisStateTop5Instances(indexPatternId),
      },
    },
    '9': {
      gridData: {
        w: 12,
        h: 11,
        x: 0,
        y: 10,
        i: '9',
      },
      type: 'visualization',
      explicitInput: {
        id: '9',
        savedVis: getVisStateTopProjectIdBySource(indexPatternId),
      },
    },
    '10': {
      gridData: {
        w: 36,
        h: 11,
        x: 12,
        y: 18,
        i: '10',
      },
      type: 'visualization',
      explicitInput: {
        id: '10',
        savedVis: getVisStateGCPAlerts(indexPatternId),
      },
    },
    '11': {
      gridData: {
        w: 20,
        h: 11,
        x: 0,
        y: 21,
        i: '11',
      },
      type: 'visualization',
      explicitInput: {
        id: '11',
        savedVis: getVisStateGCPAuthAnswer(indexPatternId),
      },
    },
    '12': {
      gridData: {
        w: 28,
        h: 11,
        x: 20,
        y: 21,
        i: '12',
      },
      type: 'visualization',
      explicitInput: {
        id: '12',
        savedVis: getVisStateTopResourceTypeProject(indexPatternId),
      },
    },
  };
  return isPinnedAgent ? agentsPanels : overviewPanels;
};
