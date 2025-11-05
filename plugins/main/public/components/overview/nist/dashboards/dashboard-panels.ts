import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import {
  NistOverviewDashboardConfig,
  NistPinnedAgentDashboardConfig,
} from '../../../../../common/dashboards/vis-definitions/overview/nist/dashboard';

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent?: boolean,
): DashboardByRendererPanels => {
  const nistDashboardConfig = isPinnedAgent
    ? new NistPinnedAgentDashboardConfig(indexPatternId)
    : new NistOverviewDashboardConfig(indexPatternId);

  return nistDashboardConfig.getDashboardPanels();
};
