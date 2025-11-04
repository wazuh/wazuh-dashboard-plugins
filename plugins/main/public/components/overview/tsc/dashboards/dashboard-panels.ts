import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import {
  TscOverviewDashboardByRendererConfig,
  TscPinnedAgentDashboardByRendererConfig,
} from '../../../../../common/dashboards/vis-definitions/overview/tsc/dashboard';

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent?: boolean,
): DashboardByRendererPanels => {
  const tscDashboardConfig = isPinnedAgent
    ? new TscPinnedAgentDashboardByRendererConfig(indexPatternId)
    : new TscOverviewDashboardByRendererConfig(indexPatternId);

  return tscDashboardConfig.getDashboardPanels();
};
