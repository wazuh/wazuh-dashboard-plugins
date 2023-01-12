import { useCallback, useState } from "react";
import { setState } from "../../../../kibana-integrations/discover/application/angular/discover_state";
import { getDataPlugin } from '../../../../kibana-services';

const getVisState = (indexPattern) => ({
  title: 'Alert level evolution',
  type: 'area',
  params: {
    type: 'area',
    grid: { categoryLines: true, style: { color: '#eee' }, valueAxis: 'ValueAxis-1' },
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
  aggs: [
    { id: '1', enabled: true, type: 'count', schema: 'metric', params: {} },
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
    {
      id: '3',
      enabled: true,
      type: 'terms',
      schema: 'group',
      params: {
        field: 'rule.level',
        size: '15',
        order: 'desc',
        orderBy: '1',
        otherBucket: false,
        otherBucketLabel: 'Other',
        missingBucket: false,
        missingBucketLabel: 'Missing',
      },
    },
  ],
  data: {
    "searchSource": {
      "query": {
        "language": "kuery",
        "query": ""
      },
      "filter": [],
      "index": indexPattern,
      // "indexRefName":"kibanaSavedObjectMeta.searchSourceJSON.index"
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
      {
        id: '3',
        enabled: true,
        type: 'terms',
        schema: 'group',
        params: {
          field: 'rule.level',
          size: '15',
          order: 'desc',
          orderBy: '1',
          otherBucket: false,
          otherBucketLabel: 'Other',
          missingBucket: false,
          missingBucketLabel: 'Missing',
        },
      },
    ]
  },

});

const getVisState2 = (indexPattern) => ({
  title: 'Top MITRE ATT&CK',
  type: 'pie',
  params: {
    type: 'pie',
    addTooltip: true,
    addLegend: true,
    legendPosition: 'right',
    isDonut: true,
    labels: { show: false, values: true, last_level: true, truncate: 100 },
  },
  uiState: { vis: { legendOpen: true } },

  data: {
    "searchSource": {
      "query": {
        "language": "kuery",
        "query": ""
      },
      "filter": [],
      "index": "wazuh-alerts-*",
      // "indexRefName":"kibanaSavedObjectMeta.searchSourceJSON.index"
    },
    "references": [
      {
        "name": "kibanaSavedObjectMeta.searchSourceJSON.index",
        "type": "index-pattern",
        "id": "wazuh-alerts-*"
      }
    ],
    aggs: [
      { id: '1', enabled: true, type: 'count', schema: 'metric', params: {} },
      {
        id: '2',
        enabled: true,
        type: 'terms',
        schema: 'segment',
        params: {
          field: 'rule.mitre.technique',
          orderBy: '1',
          order: 'desc',
          size: 20,
          otherBucket: false,
          otherBucketLabel: 'Other',
          missingBucket: false,
          missingBucketLabel: 'Missing',
        },
      },
    ],
  }
});

const getVisState3 = (indexPattern) => ({
  title: 'Top 5 agents',
  type: 'pie',
  params: {
    type: 'pie',
    addTooltip: true,
    addLegend: true,
    legendPosition: 'right',
    isDonut: true,
    labels: { show: false, values: true, last_level: true, truncate: 100 },

  },
  uiState: { vis: { legendOpen: true } },

  data: {
    "searchSource": {
      "query": {
        "language": "kuery",
        "query": ""
      },
      "filter": [],
      "index": "wazuh-alerts-*",
      // "indexRefName":"kibanaSavedObjectMeta.searchSourceJSON.index"
    },
    "references": [
      {
        "name": "kibanaSavedObjectMeta.searchSourceJSON.index",
        "type": "index-pattern",
        "id": "wazuh-alerts-*"
      }
    ],
    aggs: [
      { id: '1', enabled: true, type: 'count', schema: 'metric', params: {} },
      {
        id: '2',
        enabled: true,
        type: 'terms',
        schema: 'segment',
        params: {
          field: 'agent.name',
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
  }
})

const getVisState4 = (indexPattern) => ({
  title: 'Alerts evolution - Top 5 agents',
  type: 'histogram',
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
        show: true,
        type: 'histogram',
        mode: 'stacked',
        data: { label: 'Count', id: '1' },
        drawLinesBetweenPoints: true,
        lineWidth: 2,
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
    thresholdLine: { show: false, value: 10, width: 1, style: 'full', color: '#E7664C' },
    labels: {},
  },

  data: {
    "searchSource": {
      "query": {
        "language": "kuery",
        "query": ""
      },
      "filter": [],
      "index": "wazuh-alerts-*",
      // "indexRefName":"kibanaSavedObjectMeta.searchSourceJSON.index"
    },
    "references": [
      {
        "name": "kibanaSavedObjectMeta.searchSourceJSON.index",
        "type": "index-pattern",
        "id": "wazuh-alerts-*"
      }
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
          timeRange: { from: '2020-07-19T16:18:13.637Z', to: '2020-07-28T13:58:33.357Z' },
          useNormalizedEsInterval: true,
          scaleMetricValues: false,
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
          field: 'agent.name',
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
  }
})
const useToggle = (initialState = false) => {
  // Initialize the state
  const [state, setState] = useState(initialState);

  // Define and memorize toggler function in case we pass down the component,
  // This function change the boolean value to it's opposite value
  const toggle = useCallback(() => setState(state => !state), []);

  return [state, toggle]
}
// Input del embebible de dashboard
export const useDashboardConfiguration = (
  {
    id = 'random-id',
    title = 'title',
    indexPattern = 'wazuh-alerts-*'
  }
) => {
  const generateConfig = ()=>{
    return {
      viewMode: 'view',
      panels: {
        '2': {
          gridData: {
            w: 20,
            h: 10,
            x: 0,
            y: 0,
            i: '2',
          },
          type: 'visualization',
          explicitInput: {
            id: '2',
            savedVis: getVisState(indexPattern),
          },
        },
        '3': {
          gridData: {
            w: 20,
            h: 10,
            x: 20,
            y: 0,
            i: '3',
          },
          type: 'visualization',
          explicitInput: {
            id: '3',
            savedVis: getVisState2(indexPattern)
          },
        },
        '4': {
          gridData: {
            w: 20,
            h: 10,
            x: 0,
            y: 10,
            i: '4',
          },
          type: 'visualization',
          explicitInput: {
            id: '4',
            savedVis: getVisState3(indexPattern)
          },
        },
        '5': {
          gridData: {
            w: 20,
            h: 10,
            x: 20,
            y: 10,
            i: '5',
          },
          type: 'visualization',
          explicitInput: {
            id: '5',
            savedVis: getVisState4(indexPattern)
          },
        },
      },
      isFullScreenMode: false,
      filters: getDataPlugin().query.filterManager.getFilters(),
      useMargins: true,
      id: id,
      timeRange: getDataPlugin().query.timefilter.timefilter.getTime(),
      timeRestore: false,
      title: title,
      query: getDataPlugin().query.queryString.getQuery(),
      refreshConfig: {
        pause: false,
        value: 15,
      },
      indexPattern: indexPattern,
      hidePanelTitles: false
    }
  };

  const [config, setConfig] = useState(generateConfig());
  const setDashboardConfig = useCallback(()=>{
    setConfig(generateConfig())
  },[]);

  return [config, setDashboardConfig]
};
