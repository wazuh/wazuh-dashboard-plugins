import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import {
  HipaaOverviewDashboardConfig,
} from '../../../../../common/dashboards/dashboard-definitions/overview/hipaa/overview/dashboard';
import { HipaaPinnedAgentDashboardConfig } from "../../../../../common/dashboards/dashboard-definitions/overview/hipaa/pinned-agent/dashboard";

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent?: boolean,
): DashboardByRendererPanels => {
  const hipaaDashboardConfig = isPinnedAgent
    ? new HipaaPinnedAgentDashboardConfig(indexPatternId)
    : new HipaaOverviewDashboardConfig(indexPatternId);

  return hipaaDashboardConfig.getDashboardPanels();
};
