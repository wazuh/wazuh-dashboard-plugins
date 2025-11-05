import { FimFilesDashboardConfig } from '../../../../../../../common/dashboards/vis-definitions/overview/fim/files/dashboard';

export const getDashboard = (indexPatternId: string) => {
  return new FimFilesDashboardConfig(
    indexPatternId,
  ).getDashboardPanels();
};
