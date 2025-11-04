import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import {
  GDPRPinnedAgentDashboardByRendererConfig,
  GDPROverviewDashboardByRendererConfig,
} from '../../../../../common/dashboards/overview/gdpr/dashboard';

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent?: boolean,
): DashboardByRendererPanels => {
  const gdprDashboardByRendererConfig = isPinnedAgent
    ? new GDPRPinnedAgentDashboardByRendererConfig(indexPatternId)
    : new GDPROverviewDashboardByRendererConfig(indexPatternId);

  return gdprDashboardByRendererConfig.getDashboardPanels();
};
