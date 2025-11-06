import {
  AgentsEventsDashboardConfig,
} from '../../../common/dashboards/vis-definitions/management/agent/overview/dashboard';
import type { DashboardConfig } from '../../../common/dashboards';
import { WazuhDiscoverDashboardConfig } from '../../../common/dashboards/vis-definitions/wazuh-discover/events/dashboard';
import {
  AWSPinnedAgentDashboardConfig,
  AWSOverviewDashboardConfig,
} from '../../../common/dashboards/vis-definitions/overview/aws/dashboard';
import {
  AzurePinnedAgentDashboardConfig,
  AzureOverviewDashboardConfig,
} from '../../../common/dashboards/vis-definitions/overview/azure/dashboard';
import {
  DockerPinnedAgentDashboardConfig,
  DockerOverviewDashboardConfig,
} from '../../../common/dashboards/vis-definitions/overview/docker/dashboard';
import {
  FimOverviewDashboardConfig,
} from '../../../common/dashboards/vis-definitions/overview/fim/overview/dashboard';
import { FimFilesDashboardConfig } from '../../../common/dashboards/vis-definitions/overview/fim/files/dashboard';
import { FimRegistryKeysDashboardConfig } from '../../../common/dashboards/vis-definitions/overview/fim/registry-keys/dashboard';
import { FimRegistryValuesDashboardConfig } from '../../../common/dashboards/vis-definitions/overview/fim/registry-values/dashboard';
import {
  GDPRPinnedAgentDashboardConfig,
  GDPROverviewDashboardConfig,
} from '../../../common/dashboards/vis-definitions/overview/gdpr/dashboard';
import {
  GithubPinnedAgentDashboardConfig,
  GithubOverviewDashboardConfig,
} from '../../../common/dashboards/vis-definitions/overview/github/dashboard';
import { GithubDrilldownActionDashboardConfig } from '../../../common/dashboards/vis-definitions/overview/github/panel/config/github-drilldown-action/dashboard';
import { GithubDrilldownActorDashboardConfig } from '../../../common/dashboards/vis-definitions/overview/github/panel/config/github-drilldown-actor/dashboard';
import { GithubDrilldownOrganizationDashboardConfig } from '../../../common/dashboards/vis-definitions/overview/github/panel/config/github-drilldown-organization/dashboard';
import { GithubDrilldownRepositoryDashboardConfig } from '../../../common/dashboards/vis-definitions/overview/github/panel/config/github-drilldown-repository/dashboard';
import {
  GoogleCloudOverviewDashboardConfig,
  GoogleCloudPinnedAgentDashboardConfig,
} from '../../../common/dashboards/vis-definitions/overview/google-cloud/dashboard';
import {
  HipaaPinnedAgentDashboardConfig,
  HipaaOverviewDashboardConfig,
} from '../../../common/dashboards/vis-definitions/overview/hipaa/dashboard';
import {
  MalwareDetectionOverviewDashboardConfig,
  MalwareDetectionPinnedAgentDashboardConfig,
} from '../../../common/dashboards/vis-definitions/overview/malware-detection/dashboard';
import {
  MitreOverviewDashboardConfig,
  MitrePinnedAgentDashboardConfig,
} from '../../../common/dashboards/vis-definitions/overview/mitre/dashboard';
import {
  NistOverviewDashboardConfig,
  NistPinnedAgentDashboardConfig,
} from '../../../common/dashboards/vis-definitions/overview/nist/dashboard';
import { OfficeOverviewDashboardConfig } from '../../../common/dashboards/vis-definitions/overview/office/dashboard';
import { OfficeKPIsDashboardConfig } from '../../../common/dashboards/vis-definitions/overview/office/kpis/dashboard';
import { OfficeDrilldownIPConfigDashboardConfig } from '../../../common/dashboards/vis-definitions/overview/office/panel/config/drilldown-ip-config/dashboard';
import { OfficeDrilldownOperationsDashboardConfig } from '../../../common/dashboards/vis-definitions/overview/office/panel/config/drilldown-operations-config/dashboard';
import { OfficeDrilldownRulesConfigDashboardConfig } from '../../../common/dashboards/vis-definitions/overview/office/panel/config/drilldown-rules-config/dashboard';
import { OfficeDrilldownUserConfigDashboardConfig } from '../../../common/dashboards/vis-definitions/overview/office/panel/config/drilldown-user-config/dashboard';
import {
  PCIOverviewDashboardConfig,
  PCIPinnedAgentDashboardConfig,
} from '../../../common/dashboards/vis-definitions/overview/pci/dashboard';
import {
  TscOverviewDashboardConfig,
  TscPinnedAgentDashboardConfig,
} from '../../../common/dashboards/vis-definitions/overview/tsc/dashboard';
import { VulnerabilitiesOverviewDashboardConfig } from '../../../common/dashboards/vis-definitions/overview/vulnerabilities/dashboard';
import { VulnerabilitiesKPIsDashboardConfig } from '../../../common/dashboards/vis-definitions/overview/vulnerabilities/kpis/dashboard';
import { VulnerabilitiesFiltersDashboardConfig } from '../../../common/dashboards/vis-definitions/overview/vulnerabilities/filters/dashboard';
import { SCAOverviewDashboardConfig } from '../../../common/dashboards/vis-definitions/overview/sca/dashboards/dashboard';
import { SCAKPIsDashboardConfig } from '../../../common/dashboards/vis-definitions/overview/sca/kpis/dashboard';
import { SCAInventoryDashboardConfig } from '../../../common/dashboards/vis-definitions/overview/sca/inventory/dashboard';
import { SCATablesDashboardConfig } from '../../../common/dashboards/vis-definitions/overview/sca/tables/dashboard';
import { ThreatHuntingOverviewDashboardConfig, ThreatHuntingPinnedAgentDashboardConfig } from '../../../common/dashboards/vis-definitions/overview/threat-hunting/dashboard';
import { ThreatHuntingKPIsDashboardConfig } from '../../../common/dashboards/vis-definitions/overview/threat-hunting/kpis/dashboard';
import { ITHygieneOverviewDashboardConfig, ITHygienePinnedAgentDashboardConfig } from '../../../common/dashboards/vis-definitions/overview/it-hygiene/dashboards/dashboard';
import { ITHygieneTablesDashboardConfig } from '../../../common/dashboards/vis-definitions/overview/it-hygiene/tables/dashboard';
import { ITHygieneKPIsDashboardConfig } from '../../../common/dashboards/vis-definitions/overview/it-hygiene/kpis/dashboard';
import { ITHygieneUsersInventoriesUsersDashboardConfig } from '../../../common/dashboards/vis-definitions/overview/it-hygiene/users/inventories/users/dashboard';
import { ITHygieneUsersInventoriesGroupsDashboardConfig } from '../../../common/dashboards/vis-definitions/overview/it-hygiene/users/inventories/groups/dashboard';
import { ITHygieneNetworksInventoriesInterfacesDashboardConfig } from '../../../common/dashboards/vis-definitions/overview/it-hygiene/networks/inventories/interfaces/dashboard';
import { ITHygieneNetworksInventoriesNetworksDashboardConfig } from '../../../common/dashboards/vis-definitions/overview/it-hygiene/networks/inventories/networks/dashboard';
import { ITHygieneNetworksInventoriesProtocolsDashboardConfig } from '../../../common/dashboards/vis-definitions/overview/it-hygiene/networks/inventories/protocols/dashboard';
import { ITHygieneNetworksInventoriesServicesDashboardConfig } from '../../../common/dashboards/vis-definitions/overview/it-hygiene/networks/inventories/services/dashboard';
import { ITHygieneNetworksInventoriesTrafficDashboardConfig } from '../../../common/dashboards/vis-definitions/overview/it-hygiene/networks/inventories/traffic/dashboard';
import { ITHygienePackagesInventoriesPackagesDashboardConfig } from '../../../common/dashboards/vis-definitions/overview/it-hygiene/packages/inventories/packages/dashboard';
import { ITHygienePackagesInventoriesHotFixesDashboardConfig } from '../../../common/dashboards/vis-definitions/overview/it-hygiene/packages/inventories/hotfixes/dashboard';
import { ITHygienePackagesInventoriesBrowserExtensionsDashboardConfig } from '../../../common/dashboards/vis-definitions/overview/it-hygiene/packages/inventories/browser-extensions/dashboard';
import { ITHygieneProcessesDashboardConfig } from '../../../common/dashboards/vis-definitions/overview/it-hygiene/processes/dashboard';
import { ITHygieneServicesDashboardConfig } from '../../../common/dashboards/vis-definitions/overview/it-hygiene/services/dashboard';
import { ITHygieneSystemInventoriesHardwareDashboardConfig } from '../../../common/dashboards/vis-definitions/overview/it-hygiene/system/inventories/hardware/dashboard';
import { ITHygieneSystemInventoriesSystemDashboardConfig } from '../../../common/dashboards/vis-definitions/overview/it-hygiene/system/inventories/system/dashboard';
import { INDEX_PATTERN_REPLACE_ME } from './constants';
import { FimPinnedAgentDashboardConfig } from "../../../common/dashboards/vis-definitions/overview/fim/pinned-agent/dashboard";

export const getDashboardConfigs = (): DashboardConfig[] => {
  const wazuhDiscoverDashboardConfig = new WazuhDiscoverDashboardConfig(
    INDEX_PATTERN_REPLACE_ME,
  );
  const agentsEventsDashboardConfig = new AgentsEventsDashboardConfig(
    INDEX_PATTERN_REPLACE_ME,
  );
  const awsOverviewDashboardConfig = new AWSOverviewDashboardConfig(
    INDEX_PATTERN_REPLACE_ME,
  );
  const awsPinnedAgentDashboardConfig =
    new AWSPinnedAgentDashboardConfig(INDEX_PATTERN_REPLACE_ME);
  const azureOverviewDashboardConfig =
    new AzureOverviewDashboardConfig(INDEX_PATTERN_REPLACE_ME);
  const azurePinnedAgentDashboardConfig =
    new AzurePinnedAgentDashboardConfig(INDEX_PATTERN_REPLACE_ME);
  const dockerOverviewDashboardConfig =
    new DockerOverviewDashboardConfig(INDEX_PATTERN_REPLACE_ME);
  const dockerPinnedAgentDashboardConfig =
    new DockerPinnedAgentDashboardConfig(INDEX_PATTERN_REPLACE_ME);
  const fimOverviewDashboardConfig =
    new FimOverviewDashboardConfig(INDEX_PATTERN_REPLACE_ME);
  const fimPinnedAgentDashboardConfig =
    new FimPinnedAgentDashboardConfig(INDEX_PATTERN_REPLACE_ME);
  const fimFilesDashboardConfig = new FimFilesDashboardConfig(
    INDEX_PATTERN_REPLACE_ME,
  );
  const fimRegistryKeysDashboardConfig =
    new FimRegistryKeysDashboardConfig(INDEX_PATTERN_REPLACE_ME);
  const fimRegistryValuesDashboardConfig =
    new FimRegistryValuesDashboardConfig(INDEX_PATTERN_REPLACE_ME);
  const gdprOverviewDashboardConfig =
    new GDPROverviewDashboardConfig(INDEX_PATTERN_REPLACE_ME);
  const gdprPinnedAgentDashboardConfig =
    new GDPRPinnedAgentDashboardConfig(INDEX_PATTERN_REPLACE_ME);
  const githubOverviewDashboardConfig =
    new GithubOverviewDashboardConfig(INDEX_PATTERN_REPLACE_ME);
  const githubPinnedAgentDashboardConfig =
    new GithubPinnedAgentDashboardConfig(INDEX_PATTERN_REPLACE_ME);
  const githubDrilldownActionDashboardConfig =
    new GithubDrilldownActionDashboardConfig(
      INDEX_PATTERN_REPLACE_ME,
    );
  const githubDrilldownActorDashboardConfig =
    new GithubDrilldownActorDashboardConfig(INDEX_PATTERN_REPLACE_ME);
  const githubDrilldownOrganizationDashboardConfig =
    new GithubDrilldownOrganizationDashboardConfig(
      INDEX_PATTERN_REPLACE_ME,
    );
  const githubDrilldownRepositoryDashboardConfig =
    new GithubDrilldownRepositoryDashboardConfig(
      INDEX_PATTERN_REPLACE_ME,
    );
  const googleCloudOverviewDashboardConfig =
    new GoogleCloudOverviewDashboardConfig(INDEX_PATTERN_REPLACE_ME);
  const googleCloudPinnedAgentDashboardConfig =
    new GoogleCloudPinnedAgentDashboardConfig(
      INDEX_PATTERN_REPLACE_ME,
    );
  const hipaaOverviewDashboardConfig =
    new HipaaOverviewDashboardConfig(INDEX_PATTERN_REPLACE_ME);
  const hipaaPinnedAgentDashboardConfig =
    new HipaaPinnedAgentDashboardConfig(INDEX_PATTERN_REPLACE_ME);
  const malwareDetectionOverviewDashboardConfig =
    new MalwareDetectionOverviewDashboardConfig(
      INDEX_PATTERN_REPLACE_ME,
    );
  const malwareDetectionPinnedAgentDashboardConfig =
    new MalwareDetectionPinnedAgentDashboardConfig(
      INDEX_PATTERN_REPLACE_ME,
    );
  const tscOverviewDashboardConfig =
    new TscOverviewDashboardConfig(INDEX_PATTERN_REPLACE_ME);
  const tscPinnedAgentDashboardConfig =
    new TscPinnedAgentDashboardConfig(INDEX_PATTERN_REPLACE_ME);
  const mitreOverviewDashboardConfig =
    new MitreOverviewDashboardConfig(INDEX_PATTERN_REPLACE_ME);
  const mitrePinnedAgentDashboardConfig =
    new MitrePinnedAgentDashboardConfig(INDEX_PATTERN_REPLACE_ME);
  const nistOverviewDashboardConfig =
    new NistOverviewDashboardConfig(INDEX_PATTERN_REPLACE_ME);
  const nistPinnedAgentDashboardConfig =
    new NistPinnedAgentDashboardConfig(INDEX_PATTERN_REPLACE_ME);
  const pciOverviewDashboardConfig =
    new PCIOverviewDashboardConfig(INDEX_PATTERN_REPLACE_ME);
  const pciPinnedAgentDashboardConfig =
    new PCIPinnedAgentDashboardConfig(INDEX_PATTERN_REPLACE_ME);
  const officeOverviewDashboardConfig =
    new OfficeOverviewDashboardConfig(INDEX_PATTERN_REPLACE_ME);
  const officeKPIsDashboardConfig =
    new OfficeKPIsDashboardConfig(INDEX_PATTERN_REPLACE_ME);
  const officeDrilldownIPConfigDashboardConfig =
    new OfficeDrilldownIPConfigDashboardConfig(INDEX_PATTERN_REPLACE_ME);
  const officeDrilldownOperationsDashboardConfig =
    new OfficeDrilldownOperationsDashboardConfig(INDEX_PATTERN_REPLACE_ME);
  const officeDrilldownRulesConfigDashboardConfig =
    new OfficeDrilldownRulesConfigDashboardConfig(INDEX_PATTERN_REPLACE_ME);
  const officeDrilldownUserConfigDashboardConfig =
    new OfficeDrilldownUserConfigDashboardConfig(INDEX_PATTERN_REPLACE_ME);
  const vulnerabilitiesOverviewDashboardConfig =
    new VulnerabilitiesOverviewDashboardConfig(INDEX_PATTERN_REPLACE_ME);
  const vulnerabilitiesKPIsDashboardConfig =
    new VulnerabilitiesKPIsDashboardConfig(INDEX_PATTERN_REPLACE_ME);
  const vulnerabilitiesFiltersDashboardConfig =
    new VulnerabilitiesFiltersDashboardConfig(INDEX_PATTERN_REPLACE_ME);
  const scaOverviewDashboardConfig = new SCAOverviewDashboardConfig(
    INDEX_PATTERN_REPLACE_ME,
  );
  const scaKPIsDashboardConfig = new SCAKPIsDashboardConfig(
    INDEX_PATTERN_REPLACE_ME,
  );
  const scaInventoryDashboardConfig =
    new SCAInventoryDashboardConfig(INDEX_PATTERN_REPLACE_ME);
  const scaTablesDashboardConfig = new SCATablesDashboardConfig(
    INDEX_PATTERN_REPLACE_ME,
  );
  const threatHuntingOverviewDashboardConfig =
    new ThreatHuntingOverviewDashboardConfig(INDEX_PATTERN_REPLACE_ME);
  const threatHuntingPinnedAgentDashboardConfig =
    new ThreatHuntingPinnedAgentDashboardConfig(INDEX_PATTERN_REPLACE_ME);
  const threatHuntingKPIsDashboardConfig =
    new ThreatHuntingKPIsDashboardConfig(INDEX_PATTERN_REPLACE_ME);
  const itHygieneOverviewDashboardConfig =
    new ITHygieneOverviewDashboardConfig(INDEX_PATTERN_REPLACE_ME);
  const itHygienePinnedAgentDashboardConfig =
    new ITHygienePinnedAgentDashboardConfig(INDEX_PATTERN_REPLACE_ME);
  const itHygieneTablesDashboardConfig =
    new ITHygieneTablesDashboardConfig(INDEX_PATTERN_REPLACE_ME);
  const itHygieneKPIsDashboardConfig =
    new ITHygieneKPIsDashboardConfig(INDEX_PATTERN_REPLACE_ME);
  const itHygieneUsersInventoriesUsersDashboardConfig =
    new ITHygieneUsersInventoriesUsersDashboardConfig(
      INDEX_PATTERN_REPLACE_ME,
    );
  const itHygieneUsersInventoriesGroupsDashboardConfig =
    new ITHygieneUsersInventoriesGroupsDashboardConfig(
      INDEX_PATTERN_REPLACE_ME,
    );
  const itHygieneNetworksInventoriesInterfacesDashboardConfig =
    new ITHygieneNetworksInventoriesInterfacesDashboardConfig(
      INDEX_PATTERN_REPLACE_ME,
    );
  const itHygieneNetworksInventoriesNetworksDashboardConfig =
    new ITHygieneNetworksInventoriesNetworksDashboardConfig(
      INDEX_PATTERN_REPLACE_ME,
    );
  const itHygieneNetworksInventoriesProtocolsDashboardConfig =
    new ITHygieneNetworksInventoriesProtocolsDashboardConfig(
      INDEX_PATTERN_REPLACE_ME,
    );
  const itHygieneNetworksInventoriesServicesDashboardConfig =
    new ITHygieneNetworksInventoriesServicesDashboardConfig(
      INDEX_PATTERN_REPLACE_ME,
    );
  const itHygieneNetworksInventoriesTrafficDashboardConfig =
    new ITHygieneNetworksInventoriesTrafficDashboardConfig(
      INDEX_PATTERN_REPLACE_ME,
    );
  const itHygienePackagesInventoriesPackagesDashboardConfig =
    new ITHygienePackagesInventoriesPackagesDashboardConfig(
      INDEX_PATTERN_REPLACE_ME,
    );
  const itHygienePackagesInventoriesHotFixesDashboardConfig =
    new ITHygienePackagesInventoriesHotFixesDashboardConfig(
      INDEX_PATTERN_REPLACE_ME,
    );
  const itHygienePackagesInventoriesBrowserExtensionsDashboardConfig =
    new ITHygienePackagesInventoriesBrowserExtensionsDashboardConfig(
      INDEX_PATTERN_REPLACE_ME,
    );
  const itHygieneProcessesDashboardConfig =
    new ITHygieneProcessesDashboardConfig(INDEX_PATTERN_REPLACE_ME);
  const itHygieneServicesDashboardConfig =
    new ITHygieneServicesDashboardConfig(INDEX_PATTERN_REPLACE_ME);
  const itHygieneSystemInventoriesHardwareDashboardConfig =
    new ITHygieneSystemInventoriesHardwareDashboardConfig(
      INDEX_PATTERN_REPLACE_ME,
    );
  const itHygieneSystemInventoriesSystemDashboardConfig =
    new ITHygieneSystemInventoriesSystemDashboardConfig(
      INDEX_PATTERN_REPLACE_ME,
    );

  return [
    wazuhDiscoverDashboardConfig,
    agentsEventsDashboardConfig,
    awsOverviewDashboardConfig,
    awsPinnedAgentDashboardConfig,
    azureOverviewDashboardConfig,
    azurePinnedAgentDashboardConfig,
    dockerOverviewDashboardConfig,
    dockerPinnedAgentDashboardConfig,
    fimOverviewDashboardConfig,
    fimPinnedAgentDashboardConfig,
    gdprOverviewDashboardConfig,
    gdprPinnedAgentDashboardConfig,
    githubOverviewDashboardConfig,
    githubPinnedAgentDashboardConfig,
    githubDrilldownActionDashboardConfig,
    githubDrilldownActorDashboardConfig,
    githubDrilldownOrganizationDashboardConfig,
    githubDrilldownRepositoryDashboardConfig,
    googleCloudOverviewDashboardConfig,
    googleCloudPinnedAgentDashboardConfig,
    hipaaOverviewDashboardConfig,
    hipaaPinnedAgentDashboardConfig,
    malwareDetectionOverviewDashboardConfig,
    malwareDetectionPinnedAgentDashboardConfig,
    tscOverviewDashboardConfig,
    tscPinnedAgentDashboardConfig,
    mitreOverviewDashboardConfig,
    mitrePinnedAgentDashboardConfig,
    nistOverviewDashboardConfig,
    nistPinnedAgentDashboardConfig,
    pciOverviewDashboardConfig,
    pciPinnedAgentDashboardConfig,
    officeOverviewDashboardConfig,
    officeKPIsDashboardConfig,
    officeDrilldownIPConfigDashboardConfig,
    officeDrilldownOperationsDashboardConfig,
    officeDrilldownRulesConfigDashboardConfig,
    officeDrilldownUserConfigDashboardConfig,
    vulnerabilitiesOverviewDashboardConfig,
    vulnerabilitiesKPIsDashboardConfig,
    vulnerabilitiesFiltersDashboardConfig,
    scaOverviewDashboardConfig,
    scaKPIsDashboardConfig,
    scaInventoryDashboardConfig,
    scaTablesDashboardConfig,
    threatHuntingOverviewDashboardConfig,
    threatHuntingPinnedAgentDashboardConfig,
    threatHuntingKPIsDashboardConfig,
    itHygieneOverviewDashboardConfig,
    itHygienePinnedAgentDashboardConfig,
    itHygieneTablesDashboardConfig,
    itHygieneKPIsDashboardConfig,
    itHygieneUsersInventoriesUsersDashboardConfig,
    itHygieneUsersInventoriesGroupsDashboardConfig,
    itHygieneNetworksInventoriesInterfacesDashboardConfig,
    itHygieneNetworksInventoriesNetworksDashboardConfig,
    itHygieneNetworksInventoriesProtocolsDashboardConfig,
    itHygieneNetworksInventoriesServicesDashboardConfig,
    itHygieneNetworksInventoriesTrafficDashboardConfig,
    itHygienePackagesInventoriesPackagesDashboardConfig,
    itHygienePackagesInventoriesHotFixesDashboardConfig,
    itHygienePackagesInventoriesBrowserExtensionsDashboardConfig,
    itHygieneProcessesDashboardConfig,
    itHygieneServicesDashboardConfig,
    itHygieneSystemInventoriesHardwareDashboardConfig,
    itHygieneSystemInventoriesSystemDashboardConfig,
    fimFilesDashboardConfig,
    fimRegistryKeysDashboardConfig,
    fimRegistryValuesDashboardConfig,
  ];
};
