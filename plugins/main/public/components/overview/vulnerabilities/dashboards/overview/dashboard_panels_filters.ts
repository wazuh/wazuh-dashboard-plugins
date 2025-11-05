import type { DashboardByRendererPanels } from '../../../../../../common/dashboards';
import { VulnerabilitiesFiltersDashboardByRendererConfig } from '../../../../../../common/dashboards/vis-definitions/overview/vulnerabilities/dashboard';

export const getDashboardFilters = (
  indexPatternId: string,
): DashboardByRendererPanels => {
  return new VulnerabilitiesFiltersDashboardByRendererConfig(
    indexPatternId,
  ).getDashboardPanels();
};
