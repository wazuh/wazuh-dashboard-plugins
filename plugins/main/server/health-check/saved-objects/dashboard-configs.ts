import type { DashboardByRendererConfig } from "../../../common/dashboards/dashboard-builder";
import { ClusterConfigurationDashboardByRendererConfig } from "../../../common/dashboards/management/cluster/dashboard";
import { AgentsEventsDashboardByRendererConfig } from '../../../common/dashboards/welcome/dashboard';
import { INDEX_PATTERN_REPLACE_ME } from './constants';

export const getDashboardConfigs = (): DashboardByRendererConfig[] => {
  const welcomeDashboardConfig = new AgentsEventsDashboardByRendererConfig(
    INDEX_PATTERN_REPLACE_ME,
  );
  const managementClusterDashboardConfig = new ClusterConfigurationDashboardByRendererConfig(
    INDEX_PATTERN_REPLACE_ME,
  );

  return [welcomeDashboardConfig, managementClusterDashboardConfig];
};
