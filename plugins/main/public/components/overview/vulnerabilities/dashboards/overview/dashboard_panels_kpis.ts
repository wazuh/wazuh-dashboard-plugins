import type { DashboardByRendererPanels } from '../../../../../../common/dashboards';
import { VulnerabilitiesKPIsDashboardByRendererConfig } from '../../../../../../common/dashboards/vis-definitions/overview/vulnerabilities/kpis/dashboard';

export const getKPIsPanel = (
  indexPatternId: string,
): DashboardByRendererPanels => {
  return new VulnerabilitiesKPIsDashboardByRendererConfig(
    indexPatternId,
  ).getDashboardPanels();
};
