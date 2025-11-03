import {
  AgentsEventsDashboardByRendererConfig,
  ClusterConfigurationDashboardByRendererConfig,
  ClusterMonitoringDashboardByRendererConfig,
} from '../../../common/dashboards';
import type { DashboardByRendererConfig } from '../../../common/dashboards/dashboard-builder';
import {
  AWSAgentPinnedDashboardByRendererConfig,
  AWSOverviewDashboardByRendererConfig,
} from '../../../common/dashboards/overview/aws/dashboard';
import {
  AzureAgentPinnedDashboardByRendererConfig,
  AzureOverviewDashboardByRendererConfig,
} from '../../../common/dashboards/overview/azure/dashboard';
import { INDEX_PATTERN_REPLACE_ME } from './constants';

export const getDashboardConfigs = (): DashboardByRendererConfig[] => {
  const welcomeDashboardConfig = new AgentsEventsDashboardByRendererConfig(
    INDEX_PATTERN_REPLACE_ME,
  );
  const clusterConfigurationDashboardConfig =
    new ClusterConfigurationDashboardByRendererConfig(INDEX_PATTERN_REPLACE_ME);
  const clusterMonitoringDashboardConfig =
    new ClusterMonitoringDashboardByRendererConfig(INDEX_PATTERN_REPLACE_ME, {
      indexPatternTitle: INDEX_PATTERN_REPLACE_ME,
      nodeList: [],
    });
  const awsOverviewDashboardConfig = new AWSOverviewDashboardByRendererConfig(
    INDEX_PATTERN_REPLACE_ME,
  );
  const awsAgentPinnedDashboardConfig =
    new AWSAgentPinnedDashboardByRendererConfig(INDEX_PATTERN_REPLACE_ME);
  const azureOverviewDashboardConfig =
    new AzureOverviewDashboardByRendererConfig(INDEX_PATTERN_REPLACE_ME);
  const azureAgentPinnedDashboardConfig =
    new AzureAgentPinnedDashboardByRendererConfig(INDEX_PATTERN_REPLACE_ME);

  return [
    welcomeDashboardConfig,
    clusterConfigurationDashboardConfig,
    clusterMonitoringDashboardConfig,
    awsOverviewDashboardConfig,
    awsAgentPinnedDashboardConfig,
    azureOverviewDashboardConfig,
    azureAgentPinnedDashboardConfig,
  ];
};
