import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import {
  GithubPinnedAgentDashboardConfig,
  GithubOverviewDashboardConfig,
} from '../../../../../common/dashboards/vis-definitions/overview/github/dashboard';

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent?: boolean,
): DashboardByRendererPanels => {
  const githubDashboardConfig = isPinnedAgent
    ? new GithubPinnedAgentDashboardConfig(indexPatternId)
    : new GithubOverviewDashboardConfig(indexPatternId);

  return githubDashboardConfig.getDashboardPanels();
};
