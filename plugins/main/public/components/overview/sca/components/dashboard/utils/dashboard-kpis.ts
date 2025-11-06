import type { DashboardByRendererPanels } from '../../../../../../../common/dashboards';
import { SCAKPIsDashboardPanelsService } from "../../../../../../../common/dashboards/dashboard-definitions/overview/sca/kpis/dashboard";


export const getKPIsPanel = (
  indexPatternId: string,
): DashboardByRendererPanels => {
  return SCAKPIsDashboardPanelsService.getDashboardPanels(indexPatternId);
};
