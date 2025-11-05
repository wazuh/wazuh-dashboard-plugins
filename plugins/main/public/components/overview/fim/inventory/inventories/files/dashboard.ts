import { FimFilesDashboardByRendererConfig } from '../../../../../../../common/dashboards/vis-definitions/overview/fim/files/dashboard';

export const getDashboard = (indexPatternId: string) => {
  return new FimFilesDashboardByRendererConfig(
    indexPatternId,
  ).getDashboardPanels();
};
