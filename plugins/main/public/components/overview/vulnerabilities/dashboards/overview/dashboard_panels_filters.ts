import type { DashboardByRendererPanels } from '../../../../../../common/dashboards';
import { VulnerabilitiesFiltersDashboardConfig } from '../../../../../../common/dashboards/dashboard-definitions/overview/vulnerabilities/filters/dashboard';

export const getDashboardFilters = (
  indexPatternId: string,
): DashboardByRendererPanels => {
  return new VulnerabilitiesFiltersDashboardConfig(
    indexPatternId,
  ).getDashboardPanels();
};
