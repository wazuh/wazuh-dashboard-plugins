import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import {
  DockerOverviewDashboardConfig,
} from '../../../../../common/dashboards/dashboard-definitions/overview/docker/overview/dashboard';
import { DockerPinnedAgentDashboardConfig } from "../../../../../common/dashboards/dashboard-definitions/overview/docker/pinned-agent/dashboard";

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent?: boolean,
): DashboardByRendererPanels => {
  const DashboardConfig = isPinnedAgent
    ? new DockerPinnedAgentDashboardConfig(indexPatternId)
    : new DockerOverviewDashboardConfig(indexPatternId);

  return DashboardConfig.getDashboardPanels();
};
