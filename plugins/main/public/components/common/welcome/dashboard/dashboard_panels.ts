import { AgentsEventsDashboardConfig } from '../../../../../common/dashboards/vis-definitions';

export const getDashboardPanels = (indexPatternId: string) => {
  return new AgentsEventsDashboardConfig(
    indexPatternId,
  ).getDashboardPanels();
};
