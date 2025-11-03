import { AgentsEventsDashboardByRendererConfig } from '../../../../../common/dashboards';

export const getDashboardPanels = (indexPatternId: string) => {
  return new AgentsEventsDashboardByRendererConfig(
    indexPatternId,
  ).getDashboardPanels();
};
