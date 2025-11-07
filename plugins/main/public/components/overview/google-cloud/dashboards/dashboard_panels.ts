import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import { GoogleCloudOverviewDashboardConfig } from '../../../../../common/dashboards/dashboard-definitions/overview/google-cloud/overview/dashboard';
import { GoogleCloudPinnedAgentDashboardConfig } from '../../../../../common/dashboards/dashboard-definitions/overview/google-cloud/pinned-agent/dashboard';

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent?: boolean,
): DashboardByRendererPanels => {
  const googleCloudDashboardConfig = isPinnedAgent
    ? new GoogleCloudPinnedAgentDashboardConfig(indexPatternId)
    : new GoogleCloudOverviewDashboardConfig(indexPatternId);

  return googleCloudDashboardConfig.getDashboardPanels();
};
