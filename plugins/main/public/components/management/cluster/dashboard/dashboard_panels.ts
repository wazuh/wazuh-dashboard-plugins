import { ClusterMonitoringDashboardConfig } from '../../../../../common/dashboards/vis-definitions/management/cluster/monitoring/dashboard';
import type { DashboardByRendererPanels } from '../../../../../common/dashboards/types';
import { tParsedIndexPattern } from '../../../common/data-source';

export const getDashboardPanels = (
  indexPattern: tParsedIndexPattern,
  nodeList: any[],
  clusterName?: string,
): DashboardByRendererPanels => {
  return new ClusterMonitoringDashboardConfig(indexPattern.id, {
    indexPatternTitle: indexPattern.title,
    nodeList,
    clusterName,
  }).getDashboardPanels();
};
