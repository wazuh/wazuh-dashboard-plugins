import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import {
  GDPROverviewDashboardConfig,
} from '../../../../../common/dashboards/vis-definitions/overview/gdpr/overview/dashboard';
import { GDPRPinnedAgentDashboardConfig } from "../../../../../common/dashboards/vis-definitions/overview/gdpr/pinned-agent/dashboard";

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent?: boolean,
): DashboardByRendererPanels => {
  const gdprDashboardConfig = isPinnedAgent
    ? new GDPRPinnedAgentDashboardConfig(indexPatternId)
    : new GDPROverviewDashboardConfig(indexPatternId);

  return gdprDashboardConfig.getDashboardPanels();
};
