import type { DashboardByValuePanels } from '../../../../../common/dashboards';
import {
  NistOverviewDashboardByRendererConfig,
  NistPinnedAgentDashboardByRendererConfig,
} from '../../../../../common/dashboards/overview/nist/dashboard';

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent?: boolean,
): DashboardByValuePanels => {
  const nistDashboardConfig = isPinnedAgent
    ? new NistPinnedAgentDashboardByRendererConfig(indexPatternId)
    : new NistOverviewDashboardByRendererConfig(indexPatternId);

  return nistDashboardConfig.getDashboardPanels();
};
