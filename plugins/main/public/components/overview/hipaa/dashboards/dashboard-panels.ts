import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import {
  HipaaOverviewDashboardByRendererConfig,
  HipaaPinnedAgentDashboardByRendererConfig,
} from '../../../../../common/dashboards/overview/hipaa/dashboard';

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent?: boolean,
): DashboardByRendererPanels => {
  const hipaaDashboardByRendererConfig = isPinnedAgent
    ? new HipaaPinnedAgentDashboardByRendererConfig(indexPatternId)
    : new HipaaOverviewDashboardByRendererConfig(indexPatternId);

  return hipaaDashboardByRendererConfig.getDashboardPanels();
};
