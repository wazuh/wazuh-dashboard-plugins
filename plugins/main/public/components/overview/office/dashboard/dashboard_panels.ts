import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import { OfficeOverviewDashboardConfig } from '../../../../../common/dashboards/dashboard-definitions/overview/office/dashboard';

export const getDashboardPanels = (
  indexPatternId: string,
): DashboardByRendererPanels => {
  return new OfficeOverviewDashboardConfig(
    indexPatternId,
  ).getDashboardPanels();
};
