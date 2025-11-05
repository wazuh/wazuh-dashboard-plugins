import type { DashboardByRendererPanels } from '../../../../../../common/dashboards';
import { VulnerabilitiesOverviewDashboardConfig } from '../../../../../../common/dashboards/vis-definitions/overview/vulnerabilities/dashboard';

export const getDashboardPanels = (
  indexPatternId: string,
): DashboardByRendererPanels => {
  return new VulnerabilitiesOverviewDashboardConfig(
    indexPatternId,
  ).getDashboardPanels();
};
