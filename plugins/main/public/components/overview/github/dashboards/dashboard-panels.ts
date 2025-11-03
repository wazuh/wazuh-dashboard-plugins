import type { DashboardByValuePanels } from '../../../../../common/dashboards';
import {
  GithubAgentPinnedDashboardByRendererConfig,
  GithubOverviewDashboardByRendererConfig,
} from '../../../../../common/dashboards/overview/github/dashboard';

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent?: boolean,
): DashboardByValuePanels => {
  const githubDashboardByRendererConfig = isPinnedAgent
    ? new GithubAgentPinnedDashboardByRendererConfig(indexPatternId)
    : new GithubOverviewDashboardByRendererConfig(indexPatternId);

  return githubDashboardByRendererConfig.getDashboardPanels();
};
