import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import { AWSOverviewDashboardConfig } from '../../../../../common/dashboards/dashboard-definitions/overview/aws/overview/dashboard';
import { AWSPinnedAgentDashboardConfig } from '../../../../../common/dashboards/dashboard-definitions/overview/aws/pinned-agent/dashboard';

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent?: boolean,
): DashboardByRendererPanels => {
  const DashboardConfig = isPinnedAgent
    ? new AWSPinnedAgentDashboardConfig(indexPatternId)
    : new AWSOverviewDashboardConfig(indexPatternId);

  return DashboardConfig.getDashboardPanels();
};
