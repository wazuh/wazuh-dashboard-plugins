import { ClusterMonitoringDashboardByRendererConfig } from '../../../../../common/dashboards/management/cluster/monitoring/dashboard';
import type { DashboardByRendererPanels } from '../../../../../common/dashboards/types';
import { tParsedIndexPattern } from '../../../common/data-source';

/* WARNING: The panel id must be unique including general and agents visualizations. Otherwise, the visualizations will not refresh when we pin an agent, because they are cached by id */

/* Overview visualizations */

/* Definition of panels */

export const getDashboardPanels = (
  indexPattern: tParsedIndexPattern,
  nodeList: any[],
  clusterName?: string,
): DashboardByRendererPanels => {
  return new ClusterMonitoringDashboardByRendererConfig(indexPattern.id, {
    indexPatternTitle: indexPattern.title,
    nodeList,
    clusterName,
  }).getDashboardPanels();
};
