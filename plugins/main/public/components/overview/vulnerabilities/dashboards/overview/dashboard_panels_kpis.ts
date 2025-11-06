import type { DashboardByRendererPanels } from '../../../../../../common/dashboards';
import { VulnerabilitiesKPIsDashboardConfig } from '../../../../../../common/dashboards/dashboard-definitions/overview/vulnerabilities/kpis/dashboard';

export const getKPIsPanel = (
  indexPatternId: string,
): DashboardByRendererPanels => {
  return new VulnerabilitiesKPIsDashboardConfig(
    indexPatternId,
  ).getDashboardPanels();
};
