import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import {
  DockerPinnedAgentDashboardConfig,
  DockerOverviewDashboardConfig,
} from '../../../../../common/dashboards/dashboard-definitions/overview/docker/dashboard';

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent?: boolean,
): DashboardByRendererPanels => {
  const DashboardConfig = isPinnedAgent
    ? new DockerPinnedAgentDashboardConfig(indexPatternId)
    : new DockerOverviewDashboardConfig(indexPatternId);

  return DashboardConfig.getDashboardPanels();
};
