import { AgentsEventsDashboardByRendererConfig } from '../../../../../common/dashboards/welcome/dashboard';

export const getDashboardPanels = (indexPatternId: string) => {
  return new AgentsEventsDashboardByRendererConfig(
    indexPatternId,
  ).getDashboardPanels();
};
