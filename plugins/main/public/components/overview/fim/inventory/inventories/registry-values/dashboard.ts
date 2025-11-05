import { FimRegistryValuesDashboardConfig } from '../../../../../../../common/dashboards/vis-definitions/overview/fim/registry-values/dashboard';

export const getDashboard = (indexPatternId: string) => {
  return new FimRegistryValuesDashboardConfig(
    indexPatternId,
  ).getDashboardPanels();
};
