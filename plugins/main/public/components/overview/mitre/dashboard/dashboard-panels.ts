import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import {
  MitreOverviewDashboardConfig,
} from '../../../../../common/dashboards/dashboard-definitions/overview/mitre/overview/dashboard';
import { MitrePinnedAgentDashboardConfig } from "../../../../../common/dashboards/dashboard-definitions/overview/mitre/pinned-agent/dashboard";

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent?: boolean,
): DashboardByRendererPanels => {
  const mitreDashboardConfig = isPinnedAgent
    ? new MitrePinnedAgentDashboardConfig(indexPatternId)
    : new MitreOverviewDashboardConfig(indexPatternId);

  return mitreDashboardConfig.getDashboardPanels();
};
