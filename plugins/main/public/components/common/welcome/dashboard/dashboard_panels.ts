import { AgentsEventsDashboardConfig } from '../../../../../common/dashboards/vis-definitions/management/agent/overview/dashboard';

export const getDashboardPanels = (indexPatternId: string) => {
  return new AgentsEventsDashboardConfig(
    indexPatternId,
  ).getDashboardPanels();
};
