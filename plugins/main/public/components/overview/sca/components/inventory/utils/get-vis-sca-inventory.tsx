import type { DashboardByRendererPanels } from '../../../../../../../common/dashboards';
import { SCAInventoryDashboardByRendererConfig } from '../../../../../../../common/dashboards/vis-definitions/overview/sca/inventory/dashboard';

export const getKPIsPanel = (
  indexPatternId: string,
): DashboardByRendererPanels => {
  return new SCAInventoryDashboardByRendererConfig(
    indexPatternId,
  ).getDashboardPanels();
};
