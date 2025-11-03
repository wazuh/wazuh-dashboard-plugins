import type { DashboardByValuePanels } from '../../../../../common/dashboards';
import {
  GDPRPinnedAgentDashboardByRendererConfig,
  GDPROverviewDashboardByRendererConfig,
} from '../../../../../common/dashboards/overview/gdpr/dashboard';

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent: boolean,
): DashboardByValuePanels => {
  const gdprDashboardByRendererConfig = isPinnedAgent
    ? new GDPRPinnedAgentDashboardByRendererConfig(indexPatternId)
    : new GDPROverviewDashboardByRendererConfig(indexPatternId);

  return gdprDashboardByRendererConfig.getDashboardPanels();
};
