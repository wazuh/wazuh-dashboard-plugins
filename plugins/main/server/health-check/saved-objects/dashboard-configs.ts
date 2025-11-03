import {
  AgentsEventsDashboardByRendererConfig,
  ClusterConfigurationDashboardByRendererConfig,
  ClusterMonitoringDashboardByRendererConfig,
} from '../../../common/dashboards';
import type { DashboardByRendererConfig } from '../../../common/dashboards/dashboard-builder';
import {
  AWSPinnedAgentDashboardByRendererConfig,
  AWSOverviewDashboardByRendererConfig,
} from '../../../common/dashboards/overview/aws/dashboard';
import {
  AzurePinnedAgentDashboardByRendererConfig,
  AzureOverviewDashboardByRendererConfig,
} from '../../../common/dashboards/overview/azure/dashboard';
import {
  DockerPinnedAgentDashboardByRendererConfig,
  DockerOverviewDashboardByRendererConfig,
} from '../../../common/dashboards/overview/docker/dashboard';
import {
  FimPinnedAgentDashboardByRendererConfig,
  FimOverviewDashboardByRendererConfig,
} from '../../../common/dashboards/overview/fim/dashboard';
import {
  GDPRPinnedAgentDashboardByRendererConfig,
  GDPROverviewDashboardByRendererConfig,
} from '../../../common/dashboards/overview/gdpr/dashboard';
import {
  GithubPinnedAgentDashboardByRendererConfig,
  GithubOverviewDashboardByRendererConfig,
} from '../../../common/dashboards/overview/github/dashboard';
import { GithubDrilldownActionDashboardByRendererConfig } from '../../../common/dashboards/overview/github/panel/config/github-drilldown-action/dashboard';
import { GithubDrilldownActorDashboardByRendererConfig } from '../../../common/dashboards/overview/github/panel/config/github-drilldown-actor/dashboard';
import { GithubDrilldownOrganizationDashboardByRendererConfig } from '../../../common/dashboards/overview/github/panel/config/github-drilldown-organization/dashboard';
import { GithubDrilldownRepositoryDashboardByRendererConfig } from '../../../common/dashboards/overview/github/panel/config/github-drilldown-repository/dashboard';
import {
  GoogleCloudOverviewDashboardByRendererConfig,
  GoogleCloudPinnedAgentDashboardByRendererConfig,
} from '../../../common/dashboards/overview/google-cloud/dashboard';
import {
  HipaaPinnedAgentDashboardByRendererConfig,
  HipaaOverviewDashboardByRendererConfig,
} from '../../../common/dashboards/overview/hipaa/dashboard';
import {
  MalwareDetectionOverviewDashboardByRendererConfig,
  MalwareDetectionPinnedAgentDashboardByRendererConfig,
} from '../../../common/dashboards/overview/malware-detection/dashboard';
import { TscOverviewDashboardByRendererConfig, TscPinnedAgentDashboardByRendererConfig } from "../../../common/dashboards/overview/tsc/dashboard";
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
  const awsPinnedAgentDashboardConfig =
    new AWSPinnedAgentDashboardByRendererConfig(INDEX_PATTERN_REPLACE_ME);
  const azureOverviewDashboardConfig =
    new AzureOverviewDashboardByRendererConfig(INDEX_PATTERN_REPLACE_ME);
  const azurePinnedAgentDashboardConfig =
    new AzurePinnedAgentDashboardByRendererConfig(INDEX_PATTERN_REPLACE_ME);
  const dockerOverviewDashboardByRendererConfig =
    new DockerOverviewDashboardByRendererConfig(INDEX_PATTERN_REPLACE_ME);
  const dockerPinnedAgentDashboardByRendererConfig =
    new DockerPinnedAgentDashboardByRendererConfig(INDEX_PATTERN_REPLACE_ME);
  const fimOverviewDashboardByRendererConfig =
    new FimOverviewDashboardByRendererConfig(INDEX_PATTERN_REPLACE_ME);
  const fimPinnedAgentDashboardByRendererConfig =
    new FimPinnedAgentDashboardByRendererConfig(INDEX_PATTERN_REPLACE_ME);
  const gdprOverviewDashboardByRendererConfig =
    new GDPROverviewDashboardByRendererConfig(INDEX_PATTERN_REPLACE_ME);
  const gdprPinnedAgentDashboardByRendererConfig =
    new GDPRPinnedAgentDashboardByRendererConfig(INDEX_PATTERN_REPLACE_ME);
  const githubOverviewDashboardByRendererConfig =
    new GithubOverviewDashboardByRendererConfig(INDEX_PATTERN_REPLACE_ME);
  const githubPinnedAgentDashboardByRendererConfig =
    new GithubPinnedAgentDashboardByRendererConfig(INDEX_PATTERN_REPLACE_ME);
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
  const githubDrilldownRepositoryDashboardByRendererConfig =
    new GithubDrilldownRepositoryDashboardByRendererConfig(
      INDEX_PATTERN_REPLACE_ME,
    );
  const googleCloudOverviewDashboardByRendererConfig =
    new GoogleCloudOverviewDashboardByRendererConfig(INDEX_PATTERN_REPLACE_ME);
  const googleCloudPinnedAgentDashboardByRendererConfig =
    new GoogleCloudPinnedAgentDashboardByRendererConfig(
      INDEX_PATTERN_REPLACE_ME,
    );
  const hipaaOverviewDashboardByRendererConfig =
    new HipaaOverviewDashboardByRendererConfig(INDEX_PATTERN_REPLACE_ME);
  const hipaaPinnedAgentDashboardByRendererConfig =
    new HipaaPinnedAgentDashboardByRendererConfig(INDEX_PATTERN_REPLACE_ME);
  const malwareDetectionOverviewDashboardByRendererConfig =
    new MalwareDetectionOverviewDashboardByRendererConfig(
      INDEX_PATTERN_REPLACE_ME,
    );
  const malwareDetectionPinnedAgentDashboardByRendererConfig =
    new MalwareDetectionPinnedAgentDashboardByRendererConfig(
      INDEX_PATTERN_REPLACE_ME,
    );
  const tscOverviewDashboardByRendererConfig =
    new TscOverviewDashboardByRendererConfig(INDEX_PATTERN_REPLACE_ME);
  const tscPinnedAgentDashboardByRendererConfig =
    new TscPinnedAgentDashboardByRendererConfig(INDEX_PATTERN_REPLACE_ME);

  return [
    welcomeDashboardConfig,
    clusterConfigurationDashboardConfig,
    clusterMonitoringDashboardConfig,
    awsOverviewDashboardConfig,
    awsPinnedAgentDashboardConfig,
    azureOverviewDashboardConfig,
    azurePinnedAgentDashboardConfig,
    dockerOverviewDashboardByRendererConfig,
    dockerPinnedAgentDashboardByRendererConfig,
    fimOverviewDashboardByRendererConfig,
    fimPinnedAgentDashboardByRendererConfig,
    gdprOverviewDashboardByRendererConfig,
    gdprPinnedAgentDashboardByRendererConfig,
    githubOverviewDashboardByRendererConfig,
    githubPinnedAgentDashboardByRendererConfig,
    githubDrilldownActionDashboardByRendererConfig,
    githubDrilldownActorDashboardByRendererConfig,
    githubDrilldownOrganizationDashboardByRendererConfig,
    githubDrilldownRepositoryDashboardByRendererConfig,
    googleCloudOverviewDashboardByRendererConfig,
    googleCloudPinnedAgentDashboardByRendererConfig,
    hipaaOverviewDashboardByRendererConfig,
    hipaaPinnedAgentDashboardByRendererConfig,
    malwareDetectionOverviewDashboardByRendererConfig,
    malwareDetectionPinnedAgentDashboardByRendererConfig,
    tscOverviewDashboardByRendererConfig,
    tscPinnedAgentDashboardByRendererConfig,
  ];
};
