import { ClusterConfigurationDashboardConfig } from "../../../../../common/dashboards/vis-definitions/management/cluster/configuration/dashboard";

export const getDashboardConfigurationPanels = (indexPatternId: string) => {
  return new ClusterConfigurationDashboardConfig(
    indexPatternId,
  ).getDashboardPanels();
};
