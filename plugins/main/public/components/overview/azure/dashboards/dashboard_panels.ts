import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import { AzureOverviewDashboardConfig } from '../../../../../common/dashboards/dashboard-definitions/overview/azure/overview/dashboard';
import { AzurePinnedAgentDashboardConfig } from '../../../../../common/dashboards/dashboard-definitions/overview/azure/pinned-agent/dashboard';

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent?: boolean,
): DashboardByRendererPanels => {
  const DashboardConfig = isPinnedAgent
    ? new AzurePinnedAgentDashboardConfig(indexPatternId)
    : new AzureOverviewDashboardConfig(indexPatternId);

  return DashboardConfig.getDashboardPanels();
};
