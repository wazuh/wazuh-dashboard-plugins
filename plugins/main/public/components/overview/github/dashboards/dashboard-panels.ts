import type { DashboardByRendererPanels } from '../../../../../common/dashboards';
import {
  GithubOverviewDashboardConfig,
} from '../../../../../common/dashboards/vis-definitions/overview/github/overview/dashboard';
import { GithubPinnedAgentDashboardConfig } from "../../../../../common/dashboards/vis-definitions/overview/github/pinned-agent/dashboard";

export const getDashboardPanels = (
  indexPatternId: string,
  isPinnedAgent?: boolean,
): DashboardByRendererPanels => {
  const githubDashboardConfig = isPinnedAgent
    ? new GithubPinnedAgentDashboardConfig(indexPatternId)
    : new GithubOverviewDashboardConfig(indexPatternId);

  return githubDashboardConfig.getDashboardPanels();
};
