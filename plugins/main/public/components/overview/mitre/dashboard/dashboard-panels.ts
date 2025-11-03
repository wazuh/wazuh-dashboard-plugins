import type { DashboardByValuePanels } from '../../../../../common/dashboards';
import {
  MitreOverviewDashboardByRendererConfig,
  MitrePinnedAgentDashboardByRendererConfig,
} from '../../../../../common/dashboards/overview/mitre/dashboard';

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent?: boolean,
): DashboardByValuePanels => {
  const mitreDashboardConfig = isPinnedAgent
    ? new MitrePinnedAgentDashboardByRendererConfig(indexPatternId)
    : new MitreOverviewDashboardByRendererConfig(indexPatternId);

  return mitreDashboardConfig.getDashboardPanels();
};
