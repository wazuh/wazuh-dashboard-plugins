import { FimRegistryKeysDashboardConfig } from '../../../../../../../common/dashboards/dashboard-definitions/overview/fim/registry-keys/dashboard';

export const getDashboard = (indexPatternId: string) => {
  return new FimRegistryKeysDashboardConfig(
    indexPatternId,
  ).getDashboardPanels();
};
