/* WARNING: The panel id must be unique including general and agents visualizations. Otherwise, the visualizations will not refresh when we pin an agent, because they are cached by id */

import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import { ServerManagementStatisticsListenerEngineDashboardConfig } from '../../../../../common/dashboards/dashboard-definitions/management/server/statistics/listener-engine/dashboard';

/* Definitiion of panels */

export const getDashboardPanelsListenerEngine = (
  indexPatternId: string,
): DashboardByRendererPanels => {
  return new ServerManagementStatisticsListenerEngineDashboardConfig(
    indexPatternId,
  ).getDashboardPanels();
};
