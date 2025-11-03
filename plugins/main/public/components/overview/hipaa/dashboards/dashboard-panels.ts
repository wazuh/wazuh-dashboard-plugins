import type { DashboardByValuePanels } from '../../../../../common/dashboards';
import {
  HipaaOverviewDashboardByRendererConfig,
  HipaaAgentPinnedDashboardByRendererConfig,
} from '../../../../../common/dashboards/overview/hipaa/dashboard';

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent?: boolean,
): DashboardByValuePanels => {
  const hipaaDashboardByRendererConfig = isPinnedAgent
    ? new HipaaAgentPinnedDashboardByRendererConfig(indexPatternId)
    : new HipaaOverviewDashboardByRendererConfig(indexPatternId);

  return hipaaDashboardByRendererConfig.getDashboardPanels();
};
