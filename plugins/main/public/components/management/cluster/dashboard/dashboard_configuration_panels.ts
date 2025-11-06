import { ClusterConfigurationDashboardConfig } from "../../../../../common/dashboards/dashboard-definitions/management/cluster/configuration/dashboard";

export const getDashboardConfigurationPanels = (indexPatternId: string) => {
  return new ClusterConfigurationDashboardConfig(
    indexPatternId,
  ).getDashboardPanels();
};
