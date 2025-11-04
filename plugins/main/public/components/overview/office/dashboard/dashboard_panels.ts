import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import { OfficeOverviewDashboardByRendererConfig } from '../../../../../common/dashboards/vis-definitions/overview/office/dashboard';

export const getDashboardPanels = (
  indexPatternId: string,
): DashboardByRendererPanels => {
  return new OfficeOverviewDashboardByRendererConfig(
    indexPatternId,
  ).getDashboardPanels();
};
