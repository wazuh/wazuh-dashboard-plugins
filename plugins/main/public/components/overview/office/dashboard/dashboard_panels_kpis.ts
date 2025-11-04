import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import { OfficeKPIsDashboardByRendererConfig } from '../../../../../common/dashboards/vis-definitions/overview/office/kpis/dashboard';

export const getKPIsPanel = (
  indexPatternId: string,
): DashboardByRendererPanels => {
  return new OfficeKPIsDashboardByRendererConfig(
    indexPatternId,
  ).getDashboardPanels();
};
