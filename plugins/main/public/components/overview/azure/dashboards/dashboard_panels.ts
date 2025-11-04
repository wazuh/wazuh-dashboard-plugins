import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import {
  AzurePinnedAgentDashboardByRendererConfig,
  AzureOverviewDashboardByRendererConfig,
} from '../../../../../common/dashboards/overview/azure/dashboard';

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent?: boolean,
): DashboardByRendererPanels => {
  const dashboardByRendererConfig = isPinnedAgent
    ? new AzurePinnedAgentDashboardByRendererConfig(indexPatternId)
    : new AzureOverviewDashboardByRendererConfig(indexPatternId);

  return dashboardByRendererConfig.getDashboardPanels();
};
