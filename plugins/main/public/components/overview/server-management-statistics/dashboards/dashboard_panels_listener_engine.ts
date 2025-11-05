/* WARNING: The panel id must be unique including general and agents visualizations. Otherwise, the visualizations will not refresh when we pin an agent, because they are cached by id */

import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import { ServerManagementStatisticsListenerEngineDashboardByRendererConfig } from '../../../../../common/dashboards/vis-definitions/overview/server-management/statistics/listener-engine/dashboard';

/* Definitiion of panels */

export const getDashboardPanelsListenerEngine = (
  indexPatternId: string,
): DashboardByRendererPanels => {
  return new ServerManagementStatisticsListenerEngineDashboardByRendererConfig(
    indexPatternId,
  ).getDashboardPanels();
};
