import type { DashboardByValuePanels } from '../../../../../common/dashboards';
import {
  DockerAgentPinnedDashboardByRendererConfig,
  DockerOverviewDashboardByRendererConfig,
} from '../../../../../common/dashboards/overview/docker/dashboard';

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent?: boolean,
): DashboardByValuePanels => {
  const DashboardByRendererConfig = isPinnedAgent
    ? new DockerAgentPinnedDashboardByRendererConfig(indexPatternId)
    : new DockerOverviewDashboardByRendererConfig(indexPatternId);

  return DashboardByRendererConfig.getDashboardPanels();
};
