import type { DashboardByRendererPanels } from '../../../../../../common/dashboards';
import { VulnerabilitiesOverviewDashboardByRendererConfig } from '../../../../../../common/dashboards/vis-definitions/overview/vulnerabilities/dashboard';

export const getDashboardPanels = (
  indexPatternId: string,
): DashboardByRendererPanels => {
  return new VulnerabilitiesOverviewDashboardByRendererConfig(
    indexPatternId,
  ).getDashboardPanels();
};
