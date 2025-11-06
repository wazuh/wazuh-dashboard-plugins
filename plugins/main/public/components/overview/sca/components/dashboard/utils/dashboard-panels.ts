import type { DashboardByRendererPanels } from '../../../../../../../common/dashboards';
import { SCAOverviewDashboardPanelsService } from '../../../../../../../common/dashboards/dashboard-definitions/overview/sca/overview/dashboard';

/**
 * Overview Dashboard Panels
 */
export const getDashboardPanels = (
  indexPatternId: string,
): DashboardByRendererPanels => {
  return SCAOverviewDashboardPanelsService.getDashboardPanels(indexPatternId);
};
