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
import {
  DockerAgentPinnedDashboardByRendererConfig,
  DockerOverviewDashboardByRendererConfig,
} from '../../../common/dashboards/overview/docker/dashboard';
import {
  FimAgentPinnedDashboardByRendererConfig,
  FimOverviewDashboardByRendererConfig,
} from '../../../common/dashboards/overview/fim/dashboard';
import {
  GDPRAgentPinnedDashboardByRendererConfig,
  GDPROverviewDashboardByRendererConfig,
} from '../../../common/dashboards/overview/gdpr/dashboard';
import {
  GithubAgentPinnedDashboardByRendererConfig,
  GithubOverviewDashboardByRendererConfig,
} from '../../../common/dashboards/overview/github/dashboard';
import { GithubDrilldownActionDashboardByRendererConfig } from '../../../common/dashboards/overview/github/panel/config/github-drilldown-action/dashboard';
import { GithubDrilldownActorDashboardByRendererConfig } from '../../../common/dashboards/overview/github/panel/config/github-drilldown-actor/dashboard';
import { GithubDrilldownOrganizationDashboardByRendererConfig } from '../../../common/dashboards/overview/github/panel/config/github-drilldown-organization/dashboard';
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
      clusterName: '',
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
  const dockerOverviewDashboardByRendererConfig =
    new DockerOverviewDashboardByRendererConfig(INDEX_PATTERN_REPLACE_ME);
  const dockerAgentPinnedDashboardByRendererConfig =
    new DockerAgentPinnedDashboardByRendererConfig(INDEX_PATTERN_REPLACE_ME);
  const fimOverviewDashboardByRendererConfig =
    new FimOverviewDashboardByRendererConfig(INDEX_PATTERN_REPLACE_ME);
  const fimAgentPinnedDashboardByRendererConfig =
    new FimAgentPinnedDashboardByRendererConfig(INDEX_PATTERN_REPLACE_ME);
  const gdprOverviewDashboardByRendererConfig =
    new GDPROverviewDashboardByRendererConfig(INDEX_PATTERN_REPLACE_ME);
  const gdprAgentPinnedDashboardByRendererConfig =
    new GDPRAgentPinnedDashboardByRendererConfig(INDEX_PATTERN_REPLACE_ME);
  const githubOverviewDashboardByRendererConfig =
    new GithubOverviewDashboardByRendererConfig(INDEX_PATTERN_REPLACE_ME);
  const githubAgentPinnedDashboardByRendererConfig =
    new GithubAgentPinnedDashboardByRendererConfig(INDEX_PATTERN_REPLACE_ME);
  const githubDrilldownActionDashboardByRendererConfig =
    new GithubDrilldownActionDashboardByRendererConfig(
      INDEX_PATTERN_REPLACE_ME,
    );
  const githubDrilldownActorDashboardByRendererConfig =
    new GithubDrilldownActorDashboardByRendererConfig(INDEX_PATTERN_REPLACE_ME);
  const githubDrilldownOrganizationDashboardByRendererConfig =
    new GithubDrilldownOrganizationDashboardByRendererConfig(
      INDEX_PATTERN_REPLACE_ME,
    );

  return [
    welcomeDashboardConfig,
    clusterConfigurationDashboardConfig,
    clusterMonitoringDashboardConfig,
    awsOverviewDashboardConfig,
    awsAgentPinnedDashboardConfig,
    azureOverviewDashboardConfig,
    azureAgentPinnedDashboardConfig,
    dockerOverviewDashboardByRendererConfig,
    dockerAgentPinnedDashboardByRendererConfig,
    fimOverviewDashboardByRendererConfig,
    fimAgentPinnedDashboardByRendererConfig,
    gdprOverviewDashboardByRendererConfig,
    gdprAgentPinnedDashboardByRendererConfig,
    githubOverviewDashboardByRendererConfig,
    githubAgentPinnedDashboardByRendererConfig,
    githubDrilldownActionDashboardByRendererConfig,
    githubDrilldownActorDashboardByRendererConfig,
    githubDrilldownOrganizationDashboardByRendererConfig,
  ];
};
