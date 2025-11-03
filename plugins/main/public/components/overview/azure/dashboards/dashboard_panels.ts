import type { DashboardByValuePanels } from '../../../../../common/dashboards';
import {
  AzureAgentPinnedDashboardByRendererConfig,
  AzureOverviewDashboardByRendererConfig,
} from '../../../../../common/dashboards/overview/azure/dashboard';

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent?: boolean,
): DashboardByValuePanels => {
  const dashboardByRendererConfig = isPinnedAgent
    ? new AzureAgentPinnedDashboardByRendererConfig(indexPatternId)
    : new AzureOverviewDashboardByRendererConfig(indexPatternId);

  return dashboardByRendererConfig.getDashboardPanels();
};
