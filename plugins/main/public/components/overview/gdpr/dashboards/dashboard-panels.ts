import type { DashboardByValuePanels } from '../../../../../common/dashboards';
import {
  GDPRAgentPinnedDashboardByRendererConfig,
  GDPROverviewDashboardByRendererConfig,
} from '../../../../../common/dashboards/overview/gdpr/dashboard';

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent: boolean,
): DashboardByValuePanels => {
  const gdprDashboardByRendererConfig = isPinnedAgent
    ? new GDPRAgentPinnedDashboardByRendererConfig(indexPatternId)
    : new GDPROverviewDashboardByRendererConfig(indexPatternId);

  return gdprDashboardByRendererConfig.getDashboardPanels();
};
