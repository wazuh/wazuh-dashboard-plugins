import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import { NistOverviewDashboardConfig } from '../../../../../common/dashboards/dashboard-definitions/overview/nist/overview/dashboard';
import { NistPinnedAgentDashboardConfig } from '../../../../../common/dashboards/dashboard-definitions/overview/nist/pinned-agent/dashboard';

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent?: boolean,
): DashboardByRendererPanels => {
  const nistDashboardConfig = isPinnedAgent
    ? new NistPinnedAgentDashboardConfig(indexPatternId)
    : new NistOverviewDashboardConfig(indexPatternId);

  return nistDashboardConfig.getDashboardPanels();
};
