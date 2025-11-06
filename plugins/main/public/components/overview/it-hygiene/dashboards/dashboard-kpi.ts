import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import { ITHygieneKPIsDashboardConfig } from "../../../../../common/dashboards/dashboard-definitions/overview/it-hygiene/kpis/dashboard";

export const getDashboardKPIs = (
  indexPatternId: string,
): DashboardByRendererPanels => {
  return new ITHygieneKPIsDashboardConfig(
    indexPatternId,
  ).getDashboardPanels();
};
