import { AgentsEventsDashboardByRendererConfig } from '../../../../../common/dashboards/vis-definitions';

export const getDashboardPanels = (indexPatternId: string) => {
  return new AgentsEventsDashboardByRendererConfig(
    indexPatternId,
  ).getDashboardPanels();
};
