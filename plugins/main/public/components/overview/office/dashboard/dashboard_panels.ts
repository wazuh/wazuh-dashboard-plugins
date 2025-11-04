import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import { OfficeOverviewDashboardByRendererConfig } from '../../../../../common/dashboards/overview/office/dashboard';

export const getDashboardPanels = (
  indexPatternId: string,
): DashboardByRendererPanels => {
  return new OfficeOverviewDashboardByRendererConfig(
    indexPatternId,
  ).getDashboardPanels();
};
