import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import {
  GDPRPinnedAgentDashboardConfig,
  GDPROverviewDashboardConfig,
} from '../../../../../common/dashboards/vis-definitions/overview/gdpr/dashboard';

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent?: boolean,
): DashboardByRendererPanels => {
  const gdprDashboardConfig = isPinnedAgent
    ? new GDPRPinnedAgentDashboardConfig(indexPatternId)
    : new GDPROverviewDashboardConfig(indexPatternId);

  return gdprDashboardConfig.getDashboardPanels();
};
