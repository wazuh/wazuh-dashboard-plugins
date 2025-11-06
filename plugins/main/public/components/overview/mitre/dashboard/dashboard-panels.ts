import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import {
  MitreOverviewDashboardConfig,
  MitrePinnedAgentDashboardConfig,
} from '../../../../../common/dashboards/dashboard-definitions/overview/mitre/dashboard';

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent?: boolean,
): DashboardByRendererPanels => {
  const mitreDashboardConfig = isPinnedAgent
    ? new MitrePinnedAgentDashboardConfig(indexPatternId)
    : new MitreOverviewDashboardConfig(indexPatternId);

  return mitreDashboardConfig.getDashboardPanels();
};
