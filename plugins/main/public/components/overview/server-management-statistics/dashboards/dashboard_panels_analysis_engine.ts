/* WARNING: The panel id must be unique including general and agents visualizations. Otherwise, the visualizations will not refresh when we pin an agent, because they are cached by id */

import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import { ServerManagementStatisticsDashboardByRendererConfig } from "../../../../../common/dashboards/vis-definitions/overview/server-management/statistics/dashboard";

export const getDashboardPanelsAnalysisEngine = (
  indexPatternId: string,
): DashboardByRendererPanels => {
  return new ServerManagementStatisticsDashboardByRendererConfig(
    indexPatternId,
  ).getDashboardPanels();
};
