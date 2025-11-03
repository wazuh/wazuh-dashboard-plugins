import type { DashboardByValuePanels } from '../../../../../common/dashboards';
import {
  AWSAgentPinnedDashboardByRendererConfig,
  AWSOverviewDashboardByRendererConfig,
} from '../../../../../common/dashboards/overview/aws/dashboard';

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent?: boolean,
): DashboardByValuePanels => {
  const dashboardByRendererConfig = isPinnedAgent
    ? new AWSAgentPinnedDashboardByRendererConfig(indexPatternId)
    : new AWSOverviewDashboardByRendererConfig(indexPatternId);

  return dashboardByRendererConfig.getDashboardPanels();
};
