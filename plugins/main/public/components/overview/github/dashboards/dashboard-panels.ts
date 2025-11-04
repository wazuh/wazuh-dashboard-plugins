import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import {
  GithubPinnedAgentDashboardByRendererConfig,
  GithubOverviewDashboardByRendererConfig,
} from '../../../../../common/dashboards/overview/github/dashboard';

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent?: boolean,
): DashboardByRendererPanels => {
  const githubDashboardByRendererConfig = isPinnedAgent
    ? new GithubPinnedAgentDashboardByRendererConfig(indexPatternId)
    : new GithubOverviewDashboardByRendererConfig(indexPatternId);

  return githubDashboardByRendererConfig.getDashboardPanels();
};
