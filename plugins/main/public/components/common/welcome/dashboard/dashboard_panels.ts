import { AgentsEventsDashboardConfig } from '../../../../../common/dashboards/dashboard-definitions/management/agent/overview/dashboard';

export const getDashboardPanels = (indexPatternId: string) => {
  return new AgentsEventsDashboardConfig(
    indexPatternId,
  ).getDashboardPanels();
};
