import { DashboardPanelState } from '../../../../../../../../src/plugins/dashboard/public/application';
import { EmbeddableInput } from '../../../../../../../../src/plugins/embeddable/public';

// Overview

const getVisStateTopSources = (indexPatternId: string) => {
  return {
    id: 'aws_overview_top_sources',
    title: 'Sources',
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
            field: 'data.aws.source',
            size: 5,
            order: 'desc',
            orderBy: '1',
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

const getVisStateTopAccounts = (indexPatternId: string) => {
  return {
    id: 'aws_overview_top_accounts',
    title: 'Accounts',
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
            field: 'data.aws.accountId',
            size: 5,
            order: 'desc',
            orderBy: '1',
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

const getVisStateTopBuckets = (indexPatternId: string) => {
  return {
    id: 'aws_overview_top_buckets',
    title: 'Buckets',
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
            field: 'data.aws.log_info.s3bucket',
            size: 5,
            order: 'desc',
            orderBy: '1',
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

const getVisStateRegions = (indexPatternId: string) => {
  return {
    id: 'aws_overview_regions',
    title: 'Regions',
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
            field: 'data.aws.region',
            size: 5,
            order: 'desc',
            orderBy: '1',
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

const getVisStateEventsBySource = (indexPatternId: string) => {
  return {
    id: 'aws_overview_events_by_source',
    title: 'Events by source over time',
    type: 'area',
    params: {
      type: 'area',
      grid: {
        categoryLines: true,
        style: { color: '#eee' },
        valueAxis: 'ValueAxis-1',
      },
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
          interpolate: 'cardinal',
          valueAxis: 'ValueAxis-1',
        },
      ],
      addTooltip: true,
      addLegend: true,
      legendPosition: 'right',
      times: [],
      addTimeMarker: false,
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
          schema: 'group',
          params: {
            field: 'data.aws.source',
            size: 5,
            order: 'desc',
            orderBy: '1',
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
          },
        },
        {
          id: '2',
          enabled: true,
          type: 'date_histogram',
          schema: 'segment',
          params: {
            field: 'timestamp',
            timeRange: { from: 'now-24h', to: 'now', mode: 'quick' },
            useNormalizedEsInterval: true,
            interval: 'auto',
            time_zone: 'Europe/Berlin',
            drop_partials: false,
            customInterval: '2h',
            min_doc_count: 1,
            extended_bounds: {},
          },
        },
      ],
    },
  };
};

const getVisStateEventsByBucket = (indexPatternId: string) => {
  return {
    id: 'aws_overview_events_by_bucket',
    title: 'Events by S3 bucket over time',
    type: 'area',
    params: {
      type: 'area',
      grid: {
        categoryLines: true,
        style: { color: '#eee' },
        valueAxis: 'ValueAxis-1',
      },
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
          interpolate: 'cardinal',
          valueAxis: 'ValueAxis-1',
        },
      ],
      addTooltip: true,
      addLegend: true,
      legendPosition: 'right',
      times: [],
      addTimeMarker: false,
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
          schema: 'group',
          params: {
            field: 'data.aws.log_info.s3bucket',
            size: 5,
            order: 'desc',
            orderBy: '1',
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
          },
        },
        {
          id: '2',
          enabled: true,
          type: 'date_histogram',
          schema: 'segment',
          params: {
            field: 'timestamp',
            timeRange: { from: 'now-24h', to: 'now', mode: 'quick' },
            useNormalizedEsInterval: true,
            interval: 'auto',
            time_zone: 'Europe/Berlin',
            drop_partials: false,
            customInterval: '2h',
            min_doc_count: 1,
            extended_bounds: {},
          },
        },
      ],
    },
  };
};

const getVisStateGeolocationMap = (indexPatternId: string) => {
  return {
    id: 'aws_overview_geolocation_map',
    title: 'Geolocation map',
    type: 'tile_map',
    params: {
      colorSchema: 'Green to Red',
      mapType: 'Scaled Circle Markers',
      isDesaturated: false,
      addTooltip: true,
      heatClusterSize: 1.5,
      legendPosition: 'bottomright',
      mapZoom: 1,
      mapCenter: [0, 0],
      wms: {
        enabled: false,
        options: { format: 'image/png', transparent: true },
      },
      dimensions: {
        metric: {
          accessor: 1,
          format: { id: 'number' },
          params: {},
          aggType: 'count',
        },
        geohash: {
          accessor: 0,
          format: { id: 'string' },
          params: { precision: 2, useGeocentroid: true },
          aggType: 'geohash_grid',
        },
        geocentroid: {
          accessor: 2,
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
          type: 'geohash_grid',
          schema: 'segment',
          params: {
            field: 'GeoLocation.location',
            autoPrecision: true,
            precision: 2,
            useGeocentroid: true,
            isFilteredByCollar: true,
            mapZoom: 1,
            mapCenter: [0, 0],
          },
        },
      ],
    },
  };
};

// Agent

const getVisStateAgentTopSources = (indexPatternId: string) => {
  return {
    id: 'aws_agent_top_sources',
    title: 'Sources',
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
            field: 'data.aws.source',
            size: 5,
            order: 'desc',
            orderBy: '1',
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

const getVisStateAgentTopAccounts = (indexPatternId: string) => {
  return {
    id: 'aws_agent_top_accounts',
    title: 'Accounts',
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
            field: 'data.aws.accountId',
            size: 5,
            order: 'desc',
            orderBy: '1',
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

const getVisStateAgentTopBuckets = (indexPatternId: string) => {
  return {
    id: 'aws_agent_top_buckets',
    title: 'Buckets',
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
            field: 'data.aws.log_info.s3bucket',
            size: 5,
            order: 'desc',
            orderBy: '1',
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

const getVisStateAgentRegions = (indexPatternId: string) => {
  return {
    id: 'aws_agent_regions',
    title: 'Regions',
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
            field: 'data.aws.region',
            size: 5,
            order: 'desc',
            orderBy: '1',
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

const getVisStateAgentEventsBySource = (indexPatternId: string) => {
  return {
    id: 'aws_agent_events_by_source',
    title: 'Events by source over time',
    type: 'area',
    params: {
      type: 'area',
      grid: {
        categoryLines: true,
        style: { color: '#eee' },
        valueAxis: 'ValueAxis-1',
      },
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
          interpolate: 'cardinal',
          valueAxis: 'ValueAxis-1',
        },
      ],
      addTooltip: true,
      addLegend: true,
      legendPosition: 'left',
      times: [],
      addTimeMarker: false,
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
          schema: 'group',
          params: {
            field: 'data.aws.source',
            size: 5,
            order: 'desc',
            orderBy: '1',
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
          },
        },
        {
          id: '2',
          enabled: true,
          type: 'date_histogram',
          schema: 'segment',
          params: {
            field: 'timestamp',
            timeRange: { from: 'now-24h', to: 'now', mode: 'quick' },
            useNormalizedEsInterval: true,
            interval: 'auto',
            time_zone: 'Europe/Berlin',
            drop_partials: false,
            customInterval: '2h',
            min_doc_count: 1,
            extended_bounds: {},
          },
        },
      ],
    },
  };
};

const getVisStateAgentEventsByBucket = (indexPatternId: string) => {
  return {
    id: 'aws_agent_events_by_bucket',
    title: 'Events by S3 bucket over time',
    type: 'area',
    params: {
      type: 'area',
      grid: {
        categoryLines: true,
        style: { color: '#eee' },
        valueAxis: 'ValueAxis-1',
      },
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
          interpolate: 'cardinal',
          valueAxis: 'ValueAxis-1',
        },
      ],
      addTooltip: true,
      addLegend: true,
      legendPosition: 'right',
      times: [],
      addTimeMarker: false,
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
          schema: 'group',
          params: {
            field: 'data.aws.log_info.s3bucket',
            size: 5,
            order: 'desc',
            orderBy: '1',
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
          },
        },
        {
          id: '2',
          enabled: true,
          type: 'date_histogram',
          schema: 'segment',
          params: {
            field: 'timestamp',
            timeRange: { from: 'now-24h', to: 'now', mode: 'quick' },
            useNormalizedEsInterval: true,
            interval: 'auto',
            time_zone: 'Europe/Berlin',
            drop_partials: false,
            customInterval: '2h',
            min_doc_count: 1,
            extended_bounds: {},
          },
        },
      ],
    },
  };
};

const getVisStateAgentGeolocationMap = (indexPatternId: string) => {
  return {
    id: 'aws_agent_geolocation_map',
    title: 'Geolocation map',
    type: 'tile_map',
    params: {
      colorSchema: 'Green to Red',
      mapType: 'Scaled Circle Markers',
      isDesaturated: false,
      addTooltip: true,
      heatClusterSize: 1.5,
      legendPosition: 'bottomright',
      mapZoom: 1,
      mapCenter: [0, 0],
      wms: {
        enabled: false,
        options: { format: 'image/png', transparent: true },
      },
      dimensions: {
        metric: {
          accessor: 1,
          format: { id: 'number' },
          params: {},
          aggType: 'count',
        },
        geohash: {
          accessor: 0,
          format: { id: 'string' },
          params: { precision: 2, useGeocentroid: true },
          aggType: 'geohash_grid',
        },
        geocentroid: {
          accessor: 2,
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
          type: 'geohash_grid',
          schema: 'segment',
          params: {
            field: 'GeoLocation.location',
            autoPrecision: true,
            precision: 2,
            useGeocentroid: true,
            isFilteredByCollar: true,
            mapZoom: 1,
            mapCenter: [0, 0],
          },
        },
      ],
    },
  };
};

export const getDashboardPanels = (
  indexPatternId: string,
): {
  [panelId: string]: DashboardPanelState<
    EmbeddableInput & { [k: string]: unknown }
  >;
} => {
  const overviewDashboardPanels = {
    '6': {
      gridData: {
        w: 12,
        h: 9,
        x: 0,
        y: 0,
        i: '6',
      },
      type: 'visualization',
      explicitInput: {
        id: '6',
        savedVis: getVisStateTopSources(indexPatternId),
      },
    },
    '7': {
      gridData: {
        w: 12,
        h: 9,
        x: 12,
        y: 0,
        i: '7',
      },
      type: 'visualization',
      explicitInput: {
        id: '7',
        savedVis: getVisStateTopAccounts(indexPatternId),
      },
    },
    '8': {
      gridData: {
        w: 12,
        h: 9,
        x: 24,
        y: 0,
        i: '8',
      },
      type: 'visualization',
      explicitInput: {
        id: '8',
        savedVis: getVisStateTopBuckets(indexPatternId),
      },
    },
    '9': {
      gridData: {
        w: 12,
        h: 9,
        x: 36,
        y: 0,
        i: '9',
      },
      type: 'visualization',
      explicitInput: {
        id: '9',
        savedVis: getVisStateRegions(indexPatternId),
      },
    },
    '10': {
      gridData: {
        w: 24,
        h: 12,
        x: 0,
        y: 9,
        i: '10',
      },
      type: 'visualization',
      explicitInput: {
        id: '10',
        savedVis: getVisStateEventsBySource(indexPatternId),
      },
    },
    '11': {
      gridData: {
        w: 24,
        h: 12,
        x: 24,
        y: 9,
        i: '11',
      },
      type: 'visualization',
      explicitInput: {
        id: '11',
        savedVis: getVisStateEventsByBucket(indexPatternId),
      },
    },
    '12': {
      gridData: {
        w: 48,
        h: 20,
        x: 0,
        y: 21,
        i: '12',
      },
      type: 'visualization',
      explicitInput: {
        id: '12',
        savedVis: getVisStateGeolocationMap(indexPatternId),
      },
    },
  };

  const agentDashboardPanels = {
    '13': {
      gridData: {
        w: 12,
        h: 9,
        x: 0,
        y: 0,
        i: '6',
      },
      type: 'visualization',
      explicitInput: {
        id: '6',
        savedVis: getVisStateAgentTopSources(indexPatternId),
      },
    },
    '14': {
      gridData: {
        w: 12,
        h: 9,
        x: 12,
        y: 0,
        i: '7',
      },
      type: 'visualization',
      explicitInput: {
        id: '7',
        savedVis: getVisStateAgentTopAccounts(indexPatternId),
      },
    },
    '15': {
      gridData: {
        w: 12,
        h: 9,
        x: 24,
        y: 0,
        i: '8',
      },
      type: 'visualization',
      explicitInput: {
        id: '8',
        savedVis: getVisStateAgentTopBuckets(indexPatternId),
      },
    },
    '16': {
      gridData: {
        w: 12,
        h: 9,
        x: 36,
        y: 0,
        i: '9',
      },
      type: 'visualization',
      explicitInput: {
        id: '9',
        savedVis: getVisStateAgentRegions(indexPatternId),
      },
    },
    '17': {
      gridData: {
        w: 24,
        h: 12,
        x: 0,
        y: 9,
        i: '10',
      },
      type: 'visualization',
      explicitInput: {
        id: '10',
        savedVis: getVisStateAgentEventsBySource(indexPatternId),
      },
    },
    '18': {
      gridData: {
        w: 24,
        h: 12,
        x: 24,
        y: 9,
        i: '11',
      },
      type: 'visualization',
      explicitInput: {
        id: '11',
        savedVis: getVisStateAgentEventsByBucket(indexPatternId),
      },
    },
    '19': {
      gridData: {
        w: 48,
        h: 20,
        x: 0,
        y: 21,
        i: '12',
      },
      type: 'visualization',
      explicitInput: {
        id: '12',
        savedVis: getVisStateAgentGeolocationMap(indexPatternId),
      },
    },
  };

  return overviewDashboardPanels;
};
