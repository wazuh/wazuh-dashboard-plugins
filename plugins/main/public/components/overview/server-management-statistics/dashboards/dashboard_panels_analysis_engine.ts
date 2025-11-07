/* WARNING: The panel id must be unique including general and agents visualizations. Otherwise, the visualizations will not refresh when we pin an agent, because they are cached by id */

import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import { ServerManagementStatisticsDashboardConfig } from '../../../../../common/dashboards/dashboard-definitions/management/server/statistics/overview/dashboard';

export const getDashboardPanelsAnalysisEngine = (
  indexPatternId: string,
): DashboardByRendererPanels => {
  return new ServerManagementStatisticsDashboardConfig(
    indexPatternId,
  ).getDashboardPanels();
};
