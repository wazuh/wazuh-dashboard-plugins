import { WelcomeDashboardByRendererConfig } from '../../../../../common/dashboards/welcome/dashboard';

export const getDashboardPanels = (indexPatternId: string) => {
  return new WelcomeDashboardByRendererConfig(
    indexPatternId,
  ).getDashboardPanels();
};
