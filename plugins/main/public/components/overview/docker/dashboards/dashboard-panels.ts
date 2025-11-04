import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import {
  DockerPinnedAgentDashboardByRendererConfig,
  DockerOverviewDashboardByRendererConfig,
} from '../../../../../common/dashboards/vis-definitions/overview/docker/dashboard';

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent?: boolean,
): DashboardByRendererPanels => {
  const DashboardByRendererConfig = isPinnedAgent
    ? new DockerPinnedAgentDashboardByRendererConfig(indexPatternId)
    : new DockerOverviewDashboardByRendererConfig(indexPatternId);

  return DashboardByRendererConfig.getDashboardPanels();
};
