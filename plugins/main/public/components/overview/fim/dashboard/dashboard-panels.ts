import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import {
  FimOverviewDashboardConfig,
} from '../../../../../common/dashboards/dashboard-definitions/overview/fim/overview/dashboard';
import { FimPinnedAgentDashboardConfig } from "../../../../../common/dashboards/dashboard-definitions/overview/fim/pinned-agent/dashboard";

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent?: boolean,
): DashboardByRendererPanels => {
  const DashboardConfig = isPinnedAgent
    ? new FimPinnedAgentDashboardConfig(indexPatternId)
    : new FimOverviewDashboardConfig(indexPatternId);

  return DashboardConfig.getDashboardPanels();
};
