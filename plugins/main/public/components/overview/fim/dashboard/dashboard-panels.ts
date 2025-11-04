import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import {
  FimPinnedAgentDashboardByRendererConfig,
  FimOverviewDashboardByRendererConfig,
} from '../../../../../common/dashboards/overview/fim/dashboard';

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent?: boolean,
): DashboardByRendererPanels => {
  const dashboardByRendererConfig = isPinnedAgent
    ? new FimPinnedAgentDashboardByRendererConfig(indexPatternId)
    : new FimOverviewDashboardByRendererConfig(indexPatternId);

  return dashboardByRendererConfig.getDashboardPanels();
};
