import type { DashboardByValuePanels } from '../../../../../common/dashboards';
import {
  FimAgentPinnedDashboardByRendererConfig,
  FimOverviewDashboardByRendererConfig,
} from '../../../../../common/dashboards/overview/fim/dashboard';

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent: boolean,
): DashboardByValuePanels => {
  const dashboardByRendererConfig = isPinnedAgent
    ? new FimAgentPinnedDashboardByRendererConfig(indexPatternId)
    : new FimOverviewDashboardByRendererConfig(indexPatternId);

  return dashboardByRendererConfig.getDashboardPanels();
};
