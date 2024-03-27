import { DashboardPanelState } from '../../../../../../../../src/plugins/dashboard/public/application';
import { EmbeddableInput } from '../../../../../../../../src/plugins/embeddable/public';

/* WARNING: The panel id must be unique including general and agents visualizations. Otherwise, the visualizations will not refresh when we pin an agent, because they are cached by id */

/* Overview visualizations */

const getVisStateClusterAlertsSummary = (
  indexPatternId: string,
  clusterName?: string,
) => {
  let expression = `.es(index=${indexPatternId},q="cluster.name: ${clusterName}").label("${clusterName} cluster")`;
  expression = expression.replace(/'/g, '"');
  return {
    id: 'Wazuh-App-Cluster-monitoring-Overview-Manager',
    title: 'Cluster alerts summary',
    type: 'timelion',
    params: { expression, interval: 'auto' },
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

const getVisStateAlertsByNodeSummary = (
  indexPatternId: string,
  nodeList: any[],
  clusterName?: string,
) => {
  let expression = '';
  for (const node of nodeList) {
    expression += `.es(index=${indexPatternId},q="cluster.name: ${clusterName} AND cluster.node: ${node.name}").label("${node.name}"),`;
  }
  expression = expression.substring(0, expression.length - 1);
  expression = expression.replace(/'/g, '"');
  return {
    id: 'Wazuh-App-Cluster-monitoring-Overview',
    title: 'Alerts by node summary',
    type: 'timelion',
    params: { expression, interval: 'auto' },
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

/* Definition of panels */

export const getDashboardPanels = (
  indexPatternId: string,
  nodeList: any[],
  clusterName?: string,
): {
  [panelId: string]: DashboardPanelState<
    EmbeddableInput & { [k: string]: unknown }
  >;
} => {
  return {
    '1': {
      gridData: {
        w: 24,
        h: 13,
        x: 0,
        y: 0,
        i: '1',
      },
      type: 'visualization',
      explicitInput: {
        id: '1',
        savedVis: getVisStateClusterAlertsSummary(indexPatternId, clusterName),
      },
    },
    '2': {
      gridData: {
        w: 24,
        h: 13,
        x: 24,
        y: 0,
        i: '2',
      },
      type: 'visualization',
      explicitInput: {
        id: '2',
        savedVis: getVisStateAlertsByNodeSummary(
          indexPatternId,
          nodeList,
          clusterName,
        ),
      },
    },
  };
};
