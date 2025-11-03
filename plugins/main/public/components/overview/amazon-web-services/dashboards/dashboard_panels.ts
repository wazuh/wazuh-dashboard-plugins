import type { DashboardByValuePanels } from '../../../../../common/dashboards';
import {
  AWSAgentPinnedDashboardLayoutConfig,
  AWSDashboardByRendererConfig,
  AWSOverviewDashboardLayoutConfig,
} from '../../../../../common/dashboards/overview/aws/dashboard';

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent?: boolean,
): DashboardByValuePanels => {
  const dashboardLayoutConfig = isPinnedAgent
    ? new AWSAgentPinnedDashboardLayoutConfig(indexPatternId)
    : new AWSOverviewDashboardLayoutConfig(indexPatternId);

  return new AWSDashboardByRendererConfig(
    indexPatternId,
    dashboardLayoutConfig,
  ).getDashboardPanels();
};
