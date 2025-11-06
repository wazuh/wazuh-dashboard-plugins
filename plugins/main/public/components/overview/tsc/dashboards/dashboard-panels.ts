import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import {
  TscOverviewDashboardConfig,
} from '../../../../../common/dashboards/dashboard-definitions/overview/tsc/overview/dashboard';
import { TscPinnedAgentDashboardConfig } from "../../../../../common/dashboards/dashboard-definitions/overview/tsc/pinned-agent/dashboard";

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent?: boolean,
): DashboardByRendererPanels => {
  const tscDashboardConfig = isPinnedAgent
    ? new TscPinnedAgentDashboardConfig(indexPatternId)
    : new TscOverviewDashboardConfig(indexPatternId);

  return tscDashboardConfig.getDashboardPanels();
};
