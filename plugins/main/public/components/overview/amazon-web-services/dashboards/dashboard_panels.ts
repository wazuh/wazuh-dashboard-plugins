import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import {
  AWSPinnedAgentDashboardByRendererConfig,
  AWSOverviewDashboardByRendererConfig,
} from '../../../../../common/dashboards/overview/aws/dashboard';

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent?: boolean,
): DashboardByRendererPanels => {
  const dashboardByRendererConfig = isPinnedAgent
    ? new AWSPinnedAgentDashboardByRendererConfig(indexPatternId)
    : new AWSOverviewDashboardByRendererConfig(indexPatternId);

  return dashboardByRendererConfig.getDashboardPanels();
};
