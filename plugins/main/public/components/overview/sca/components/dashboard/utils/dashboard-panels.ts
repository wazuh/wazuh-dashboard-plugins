import type { DashboardByRendererPanels } from '../../../../../../../common/dashboards';
import { SCAOverviewDashboardPanelsService } from '../../../../../../../common/dashboards/vis-definitions/overview/sca/dashboards/dashboard';

/**
 * Overview Dashboard Panels
 */
export const getDashboardPanels = (
  indexPatternId: string,
): DashboardByRendererPanels => {
  return SCAOverviewDashboardPanelsService.getDashboardPanels(indexPatternId);
};
