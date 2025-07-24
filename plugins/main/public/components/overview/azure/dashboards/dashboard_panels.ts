import { DashboardPanelState } from '../../../../../../../../src/plugins/dashboard/public/application';
import { EmbeddableInput } from '../../../../../../../../src/plugins/embeddable/public';

// Overview

// TODO: Replace field or visualizations to match Azure data structure when available

const getVisStateResults = (indexPatternId: string) => {
  return {
    id: 'azure_overview_results',
    title: 'Activity results',
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

const getVisStateDisplayName = (indexPatternId: string) => {
  return {
    id: 'azure_overview_display_name',
    title: 'Top 5 security alerts by display name',
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
          },
        },
      ],
    },
  };
};

const getVisStateCategory = (indexPatternId: string) => {
  return {
    id: 'azure_overview_category',
    title: 'Top 5 categories',
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
            field: 'data.ms-graph.category',
            size: 5,
            order: 'desc',
            orderBy: '1',
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
            customLabel: 'Top categories',
          },
        },
      ],
    },
  };
};

const getVisStateRegions = (indexPatternId: string) => {
  return {
    id: 'azure_overview_regions',
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

const getVisStateEventsByCategory = (indexPatternId: string) => {
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

const getVisStateOperationsTypes = (indexPatternId: string) => {
  return {
    id: 'azure_overview_activity_operations_types',
    title: 'Activity operations types',
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
      addLegend: true,
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
          },
        },
      ],
    },
  };
};

const getVisStateGeolocationMap = (indexPatternId: string) => {
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

const getVisStateAgentResults = (indexPatternId: string) => {
  return {
    id: 'azure_agent_activity_results',
    title: 'Activities Results',
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

const getVisStateAgentDisplayName = (indexPatternId: string) => {
  return {
    id: 'azure_agent_display_name',
    title: 'Top 5 security alerts by display name',
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
          },
        },
      ],
    },
  };
};

const getVisStateAgentCategories = (indexPatternId: string) => {
  return {
    id: 'azure_agent_categories',
    title: 'Top 5 categories',
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
      ],
    },
  };
};

const getVisStateAgentRegions = (indexPatternId: string) => {
  return {
    id: 'azure_agent_regions',
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

const getVisStateAgentEventsByCategory = (indexPatternId: string) => {
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

const getVisStateAgentOperationsTypes = (indexPatternId: string) => {
  return {
    id: 'azure_agent_operations_types',
    title: 'Top operations by type',
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

const getVisStateAgentGeolocationMap = (indexPatternId: string) => {
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

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent: boolean,
): {
  [panelId: string]: DashboardPanelState<
    EmbeddableInput & { [k: string]: unknown }
  >;
} => {
  const overviewDashboardPanels = {
    g1: {
      gridData: {
        w: 12,
        h: 9,
        x: 0,
        y: 0,
        i: 'g1',
      },
      type: 'visualization',
      explicitInput: {
        id: 'g1',
        savedVis: getVisStateResults(indexPatternId),
      },
    },
    g2: {
      gridData: {
        w: 12,
        h: 9,
        x: 12,
        y: 0,
        i: 'g2',
      },
      type: 'visualization',
      explicitInput: {
        id: 'g2',
        savedVis: getVisStateDisplayName(indexPatternId),
      },
    },
    g3: {
      gridData: {
        w: 12,
        h: 9,
        x: 24,
        y: 0,
        i: 'g3',
      },
      type: 'visualization',
      explicitInput: {
        id: 'g3',
        savedVis: getVisStateCategory(indexPatternId),
      },
    },
    g4: {
      gridData: {
        w: 12,
        h: 9,
        x: 36,
        y: 0,
        i: 'g4',
      },
      type: 'visualization',
      explicitInput: {
        id: 'g4',
        savedVis: getVisStateRegions(indexPatternId),
      },
    },
    g5: {
      gridData: {
        w: 24,
        h: 12,
        x: 0,
        y: 9,
        i: 'g5',
      },
      type: 'visualization',
      explicitInput: {
        id: 'g5',
        savedVis: getVisStateEventsByCategory(indexPatternId),
      },
    },
    g6: {
      gridData: {
        w: 24,
        h: 12,
        x: 24,
        y: 9,
        i: 'g6',
      },
      type: 'visualization',
      explicitInput: {
        id: 'g6',
        savedVis: getVisStateOperationsTypes(indexPatternId),
      },
    },
    g7: {
      gridData: {
        w: 48,
        h: 20,
        x: 0,
        y: 21,
        i: 'g7',
      },
      type: 'visualization',
      explicitInput: {
        id: 'g7',
        savedVis: getVisStateGeolocationMap(indexPatternId),
      },
    },
  };

  const agentDashboardPanels = {
    a1: {
      gridData: {
        w: 12,
        h: 9,
        x: 0,
        y: 0,
        i: 'a1',
      },
      type: 'visualization',
      explicitInput: {
        id: 'a1',
        savedVis: getVisStateAgentResults(indexPatternId),
      },
    },
    a2: {
      gridData: {
        w: 12,
        h: 9,
        x: 12,
        y: 0,
        i: 'a2',
      },
      type: 'visualization',
      explicitInput: {
        id: 'a2',
        savedVis: getVisStateAgentDisplayName(indexPatternId),
      },
    },
    a3: {
      gridData: {
        w: 12,
        h: 9,
        x: 24,
        y: 0,
        i: 'a3',
      },
      type: 'visualization',
      explicitInput: {
        id: 'a3',
        savedVis: getVisStateAgentCategories(indexPatternId),
      },
    },
    a4: {
      gridData: {
        w: 12,
        h: 9,
        x: 36,
        y: 0,
        i: 'a4',
      },
      type: 'visualization',
      explicitInput: {
        id: 'a4',
        savedVis: getVisStateAgentRegions(indexPatternId),
      },
    },
    a5: {
      gridData: {
        w: 24,
        h: 12,
        x: 0,
        y: 9,
        i: 'a5',
      },
      type: 'visualization',
      explicitInput: {
        id: 'a5',
        savedVis: getVisStateAgentEventsByCategory(indexPatternId),
      },
    },
    a6: {
      gridData: {
        w: 24,
        h: 12,
        x: 24,
        y: 9,
        i: 'a6',
      },
      type: 'visualization',
      explicitInput: {
        id: 'a6',
        savedVis: getVisStateAgentOperationsTypes(indexPatternId),
      },
    },
    a7: {
      gridData: {
        w: 48,
        h: 20,
        x: 0,
        y: 21,
        i: 'a7',
      },
      type: 'visualization',
      explicitInput: {
        id: 'a7',
        savedVis: getVisStateAgentGeolocationMap(indexPatternId),
      },
    },
  };

  return isPinnedAgent ? agentDashboardPanels : overviewDashboardPanels;
};
