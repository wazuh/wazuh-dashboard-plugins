import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import {
  FimPinnedAgentDashboardConfig,
  FimOverviewDashboardConfig,
} from '../../../../../common/dashboards/vis-definitions/overview/fim/dashboard';

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent?: boolean,
): DashboardByRendererPanels => {
  const DashboardConfig = isPinnedAgent
    ? new FimPinnedAgentDashboardConfig(indexPatternId)
    : new FimOverviewDashboardConfig(indexPatternId);

  return DashboardConfig.getDashboardPanels();
};
