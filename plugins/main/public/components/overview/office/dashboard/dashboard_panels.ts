import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import { OfficeOverviewDashboardConfig } from '../../../../../common/dashboards/vis-definitions/overview/office/dashboard';

export const getDashboardPanels = (
  indexPatternId: string,
): DashboardByRendererPanels => {
  return new OfficeOverviewDashboardConfig(
    indexPatternId,
  ).getDashboardPanels();
};
