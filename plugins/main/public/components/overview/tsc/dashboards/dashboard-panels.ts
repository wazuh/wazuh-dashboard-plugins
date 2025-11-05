import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import {
  TscOverviewDashboardConfig,
  TscPinnedAgentDashboardConfig,
} from '../../../../../common/dashboards/vis-definitions/overview/tsc/dashboard';

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent?: boolean,
): DashboardByRendererPanels => {
  const tscDashboardConfig = isPinnedAgent
    ? new TscPinnedAgentDashboardConfig(indexPatternId)
    : new TscOverviewDashboardConfig(indexPatternId);

  return tscDashboardConfig.getDashboardPanels();
};
