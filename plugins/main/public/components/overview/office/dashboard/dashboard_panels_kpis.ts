import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import { OfficeKPIsDashboardConfig } from '../../../../../common/dashboards/vis-definitions/overview/office/kpis/dashboard';

export const getKPIsPanel = (
  indexPatternId: string,
): DashboardByRendererPanels => {
  return new OfficeKPIsDashboardConfig(
    indexPatternId,
  ).getDashboardPanels();
};
