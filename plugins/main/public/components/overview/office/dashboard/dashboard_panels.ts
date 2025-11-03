import type { DashboardByValuePanels } from '../../../../../common/dashboards';
import { OfficeOverviewDashboardByRendererConfig } from '../../../../../common/dashboards/overview/office/dashboard';

export const getDashboardPanels = (
  indexPatternId: string,
): DashboardByValuePanels => {
  return new OfficeOverviewDashboardByRendererConfig(
    indexPatternId,
  ).getDashboardPanels();
};
