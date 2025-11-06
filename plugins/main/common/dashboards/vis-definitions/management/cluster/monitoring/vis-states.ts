import {
  buildIndexPatternReferenceList,
  buildSearchSource,
} from '../../../../lib';
import type { SavedVis } from '../../../../types';

export const getVisStateClusterAlertsSummary = (
  indexPattern: { id: string; title: string },
  clusterName?: string,
): SavedVis => {
  let expression = `.es(index=${indexPattern.title},q="cluster.name: ${clusterName}").label("${clusterName} cluster")`;
  expression = expression.replace(/'/g, '"');
  return {
    id: 'cluster-monitoring-overview-manager',
    title: 'Cluster alerts summary',
    type: 'timelion',
    params: { expression, interval: 'auto' },
    data: {
      searchSource: buildSearchSource(indexPattern.id),
      references: buildIndexPatternReferenceList(indexPattern.id),
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
    id: 'cluster-monitoring-overview',
    title: 'Alerts by node summary',
    type: 'timelion',
    params: { expression, interval: 'auto' },
    data: {
      searchSource: buildSearchSource(indexPattern.id),
      references: buildIndexPatternReferenceList(indexPattern.id),
      aggs: [],
    },
  };
};
