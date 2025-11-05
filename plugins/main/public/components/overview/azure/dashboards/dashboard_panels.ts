import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import {
  AzurePinnedAgentDashboardConfig,
  AzureOverviewDashboardConfig,
} from '../../../../../common/dashboards/vis-definitions/overview/azure/dashboard';

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent?: boolean,
): DashboardByRendererPanels => {
  const DashboardConfig = isPinnedAgent
    ? new AzurePinnedAgentDashboardConfig(indexPatternId)
    : new AzureOverviewDashboardConfig(indexPatternId);

  return DashboardConfig.getDashboardPanels();
};
