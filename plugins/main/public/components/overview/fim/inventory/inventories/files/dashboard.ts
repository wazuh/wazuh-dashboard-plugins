import { FimFilesDashboardConfig } from '../../../../../../../common/dashboards/dashboard-definitions/overview/fim/files/dashboard';

export const getDashboard = (indexPatternId: string) => {
  return new FimFilesDashboardConfig(indexPatternId).getDashboardPanels();
};
