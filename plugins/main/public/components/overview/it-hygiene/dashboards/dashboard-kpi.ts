import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import { ITHygieneKPIsDashboardByRendererConfig } from "../../../../../common/dashboards/vis-definitions/overview/it-hygiene/kpis/dashboard";

export const getDashboardKPIs = (
  indexPatternId: string,
): DashboardByRendererPanels => {
  return new ITHygieneKPIsDashboardByRendererConfig(
    indexPatternId,
  ).getDashboardPanels();
};
