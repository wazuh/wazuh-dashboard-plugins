import { DashboardPanelState } from '../../../../../../src/plugins/dashboard/public/application';
import { EmbeddableInput } from '/../../../../../../src/plugins/embeddable/public';

const getVisStateMonitoringOverview = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Cluster-monitoring-Overview',
    title: 'App Cluster Overview',
    type: 'timelion',
    params: {
      type: 'timelion',
      expression: '.es(*)',
      interval: 'auto',
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
      aggs: [],
    },
  };
};

const getVisStateMonitoringOverviewManager = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Cluster-monitoring-Overview-Manager',
    title: 'App Cluster Overview Manager',
    type: 'timelion',
    params: {
      expression: '.es(q=agent.id:000)',
      interval: 'auto',
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
      aggs: [],
    },
  };
};

const getVisStateMonitoringOverviewNode = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Cluster-monitoring-Overview-Node',
    title: 'App Cluster Overview Node',
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
            interval: 'auto',
            customInterval: '2h',
            min_doc_count: 1,
            extended_bounds: {},
          },
        },
      ],
    },
  };
};

const getVisStateMonitoringOverviewNodePie = (indexPatternId: string) => {
  return {
    id: 'Wazuh-App-Cluster-monitoring-Overview-Node-Pie',
    title: 'App Cluster Overview Node Pie',
    type: 'pie',
    params: {
      type: 'pie',
      addTooltip: true,
      addLegend: true,
      legendPosition: 'right',
      isDonut: true,
      labels: { show: false, values: true, last_level: true, truncate: 100 },
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
    g1: {
      gridData: {
        w: 24,
        h: 18,
        x: 0,
        y: 0,
        i: 'g1',
      },
      type: 'visualization',
      explicitInput: {
        id: 'g1',
        savedVis: getVisStateMonitoringOverview(indexPatternId),
      },
    },
    g2: {
      gridData: {
        w: 24,
        h: 18,
        x: 24,
        y: 0,
        i: 'g2',
      },
      type: 'visualization',
      explicitInput: {
        id: 'g2',
        savedVis: getVisStateMonitoringOverviewManager(indexPatternId),
      },
    },
  };

  return overviewDashboardPanels;
};
