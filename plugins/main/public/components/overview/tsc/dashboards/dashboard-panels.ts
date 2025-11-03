import type { DashboardByValuePanels } from '../../../../../common/dashboards';
import {
  TscOverviewDashboardByRendererConfig,
  TscPinnedAgentDashboardByRendererConfig,
} from '../../../../../common/dashboards/overview/tsc/dashboard';

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent?: boolean,
): DashboardByValuePanels => {
  const tscDashboardConfig = isPinnedAgent
    ? new TscPinnedAgentDashboardByRendererConfig(indexPatternId)
    : new TscOverviewDashboardByRendererConfig(indexPatternId);

  return tscDashboardConfig.getDashboardPanels();
};
