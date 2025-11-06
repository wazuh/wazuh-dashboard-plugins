import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import {
  HipaaOverviewDashboardConfig,
  HipaaPinnedAgentDashboardConfig,
} from '../../../../../common/dashboards/dashboard-definitions/overview/hipaa/dashboard';

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent?: boolean,
): DashboardByRendererPanels => {
  const hipaaDashboardConfig = isPinnedAgent
    ? new HipaaPinnedAgentDashboardConfig(indexPatternId)
    : new HipaaOverviewDashboardConfig(indexPatternId);

  return hipaaDashboardConfig.getDashboardPanels();
};
