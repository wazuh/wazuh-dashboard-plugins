import type { DashboardByValueSavedVis } from '../../types';

export const getVisStateResults = (
  indexPatternId: string,
): DashboardByValueSavedVis => {
  return {
    id: 'azure_overview_results',
    title: 'Top 5 activity results',
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
            field: 'data.ms-graph.activityResult',
            size: 5,
            order: 'desc',
            orderBy: '1',
            otherBucket: true,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
          },
        },
      ],
    },
  };
};

export const getVisStateDisplayName = (
  indexPatternId: string,
): DashboardByValueSavedVis => {
  return {
    id: 'azure_overview_display_name',
    title: '',
    type: 'table',
    params: {
      perPage: 5,
      showPartialRows: false,
      showMetricsAtAllLevels: false,
      sort: { columnIndex: 3, direction: 'desc' },
      showTotal: false,
      showToolbar: true,
      totalFunc: 'sum',
    },
    uiState: {
      vis: {
        columnsWidth: [
          {
            colIndex: 1,
            width: 100,
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
          schema: 'bucket',
          params: {
            field: 'data.ms-graph.displayName',
            size: 5,
            order: 'desc',
            orderBy: '1',
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: 'Top 5 security alerts by display name',
          },
        },
      ],
    },
  };
};

export const getVisStateRegions = (
  indexPatternId: string,
): DashboardByValueSavedVis => {
  return {
    id: 'azure_overview_regions',
    title: 'Top 5 regions',
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
            field: 'GeoLocation.region_name',
            size: 5,
            order: 'desc',
            orderBy: '1',
            otherBucket: true,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
          },
        },
      ],
    },
  };
};

export const getVisStateEventsByCategory = (
  indexPatternId: string,
): DashboardByValueSavedVis => {
  return {
    id: 'azure_overview_events_by_category',
    title: 'Events by category over time',
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
            field: 'data.ms-graph.category',
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

export const getVisStateOperationsTypes = (
  indexPatternId: string,
): DashboardByValueSavedVis => {
  return {
    id: 'azure_overview_activity_operations_types',
    title: 'Top 5 activity operations types',
    type: 'horizontal_bar',
    params: {
      grid: {
        categoryLines: true,
        style: { color: '#eee' },
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
          scale: { type: 'linear', mode: 'normal' },
          labels: { show: true, rotate: 0, filter: false, truncate: 100 },
          title: { text: 'Count' },
        },
      ],
      seriesParams: [
        {
          show: true,
          type: 'histogram',
          mode: 'stacked',
          data: { label: 'Count', id: '1' },
          valueAxis: 'ValueAxis-1',
        },
      ],
      addTooltip: true,
      addLegend: false,
      legendPosition: 'right',
    },
    data: {
      searchSource: {
        query: { language: 'kuery', query: '' },
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
            field: 'data.ms-graph.activityOperationType',
            size: 5,
            order: 'desc',
            orderBy: '1',
            otherBucket: true,
            otherBucketLabel: 'Other',
            customLabel: 'Activity operation type',
          },
        },
      ],
    },
  };
};

export const getVisStateGeolocationMap = (
  indexPatternId: string,
): DashboardByValueSavedVis => {
  return {
    id: 'azure_overview_geolocation_map',
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

export const getVisStateAgentResults = (
  indexPatternId: string,
): DashboardByValueSavedVis => {
  return {
    id: 'azure_agent_activity_results',
    title: 'Top 5 activity results',
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
            field: 'data.ms-graph.activityResult',
            size: 5,
            order: 'desc',
            orderBy: '1',
            otherBucket: true,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
          },
        },
      ],
    },
  };
};

export const getVisStateAgentDisplayName = (
  indexPatternId: string,
): DashboardByValueSavedVis => {
  return {
    id: 'azure_agent_display_name',
    type: 'table',
    params: {
      perPage: 5,
      showPartialRows: false,
      showMetricsAtAllLevels: false,
      sort: { columnIndex: 3, direction: 'desc' },
      showTotal: false,
      showToolbar: true,
      totalFunc: 'sum',
    },
    uiState: {
      vis: {
        columnsWidth: [
          {
            colIndex: 1,
            width: 100,
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
          schema: 'bucket',
          params: {
            field: 'data.ms-graph.displayName',
            size: 5,
            order: 'desc',
            orderBy: '1',
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: 'Top 5 security alerts by display name',
          },
        },
      ],
    },
  };
};

export const getVisStateAgentRegions = (
  indexPatternId: string,
): DashboardByValueSavedVis => {
  return {
    id: 'azure_agent_regions',
    title: 'Top 5 regions',
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
            field: 'GeoLocation.region_name',
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

export const getVisStateAgentEventsByCategory = (
  indexPatternId: string,
): DashboardByValueSavedVis => {
  return {
    id: 'azure_agent_events_by_Category',
    title: 'Events by category over time',
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
            field: 'data.ms-graph.category',
            size: 10,
            order: 'desc',
            orderBy: '1',
            otherBucket: true,
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

export const getVisStateAgentOperationsTypes = (
  indexPatternId: string,
): DashboardByValueSavedVis => {
  return {
    id: 'azure_agent_operations_types',
    title: 'Top 5 activity operations types',
    type: 'horizontal_bar',
    params: {
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
          show: true,
          type: 'histogram',
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
          id: '2',
          enabled: true,
          type: 'terms',
          schema: 'segment',
          params: {
            field: 'data.ms-graph.activityOperationType',
            size: 5,
            order: 'desc',
            orderBy: '1',
            otherBucket: true,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: 'Activity operation type',
          },
        },
      ],
    },
  };
};

export const getVisStateAgentGeolocationMap = (
  indexPatternId: string,
): DashboardByValueSavedVis => {
  return {
    id: 'azure_agent_geolocation_map',
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
