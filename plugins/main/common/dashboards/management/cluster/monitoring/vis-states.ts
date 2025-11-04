import type { SavedVis } from '../../../types';

export const getVisStateClusterAlertsSummary = (
  indexPattern: { id: string; title: string },
  clusterName?: string,
): SavedVis => {
  let expression = `.es(index=${indexPattern.title},q="cluster.name: ${clusterName}").label("${clusterName} cluster")`;
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
        index: indexPattern.id,
      },
      references: [
        {
          name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
          type: 'index-pattern',
          id: indexPattern.id,
        },
      ],
      aggs: [],
    },
  };
};

export const getVisStateAlertsByNodeSummary = (
  indexPattern: { id: string; title: string },
  nodeList: any[],
  clusterName?: string,
): SavedVis => {
  let expression = '';
  for (const node of nodeList) {
    expression += `.es(index=${indexPattern.title},q="cluster.name: ${clusterName} AND cluster.node: ${node.name}").label("${node.name}"),`;
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
        index: indexPattern.id,
      },
      references: [
        {
          name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
          type: 'index-pattern',
          id: indexPattern.id,
        },
      ],
      aggs: [],
    },
  };
};
