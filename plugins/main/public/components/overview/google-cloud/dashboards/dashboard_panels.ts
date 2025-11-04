import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import {
  GoogleCloudOverviewDashboardByRendererConfig,
  GoogleCloudPinnedAgentDashboardByRendererConfig,
} from '../../../../../common/dashboards/overview/google-cloud/dashboard';

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent?: boolean,
): DashboardByRendererPanels => {
  const googleCloudDashboardConfig = isPinnedAgent
    ? new GoogleCloudPinnedAgentDashboardByRendererConfig(indexPatternId)
    : new GoogleCloudOverviewDashboardByRendererConfig(indexPatternId);

  return googleCloudDashboardConfig.getDashboardPanels();
};
