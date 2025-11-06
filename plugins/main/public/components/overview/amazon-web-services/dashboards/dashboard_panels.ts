import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import {
  AWSPinnedAgentDashboardConfig,
  AWSOverviewDashboardConfig,
} from '../../../../../common/dashboards/dashboard-definitions/overview/aws/dashboard';

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent?: boolean,
): DashboardByRendererPanels => {
  const DashboardConfig = isPinnedAgent
    ? new AWSPinnedAgentDashboardConfig(indexPatternId)
    : new AWSOverviewDashboardConfig(indexPatternId);

  return DashboardConfig.getDashboardPanels();
};
