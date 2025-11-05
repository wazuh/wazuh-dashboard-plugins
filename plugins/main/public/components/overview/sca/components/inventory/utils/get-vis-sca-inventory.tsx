import type { DashboardByRendererPanels } from '../../../../../../../common/dashboards';
import { SCAInventoryDashboardConfig } from '../../../../../../../common/dashboards/vis-definitions/overview/sca/inventory/dashboard';

export const getKPIsPanel = (
  indexPatternId: string,
): DashboardByRendererPanels => {
  return new SCAInventoryDashboardConfig(
    indexPatternId,
  ).getDashboardPanels();
};
