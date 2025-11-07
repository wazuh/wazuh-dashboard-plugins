import type { DashboardConfig } from '../../../common/dashboards';
import {
  AgentsEventsDashboardConfig,
} from '../../../common/dashboards/dashboard-definitions/management/agent/overview/dashboard';
import {
  AWSOverviewDashboardConfig,
} from '../../../common/dashboards/dashboard-definitions/overview/aws/overview/dashboard';
import { AWSPinnedAgentDashboardConfig } from "../../../common/dashboards/dashboard-definitions/overview/aws/pinned-agent/dashboard";
import {
  AzureOverviewDashboardConfig,
} from '../../../common/dashboards/dashboard-definitions/overview/azure/overview/dashboard';
import { AzurePinnedAgentDashboardConfig } from "../../../common/dashboards/dashboard-definitions/overview/azure/pinned-agent/dashboard";
import {
  DockerOverviewDashboardConfig,
} from '../../../common/dashboards/dashboard-definitions/overview/docker/overview/dashboard';
import { DockerPinnedAgentDashboardConfig } from "../../../common/dashboards/dashboard-definitions/overview/docker/pinned-agent/dashboard";
import { FimFilesDashboardConfig } from '../../../common/dashboards/dashboard-definitions/overview/fim/files/dashboard';
import {
  FimOverviewDashboardConfig,
} from '../../../common/dashboards/dashboard-definitions/overview/fim/overview/dashboard';
import { FimPinnedAgentDashboardConfig } from "../../../common/dashboards/dashboard-definitions/overview/fim/pinned-agent/dashboard";
import { FimRegistryKeysDashboardConfig } from '../../../common/dashboards/dashboard-definitions/overview/fim/registry-keys/dashboard';
import { FimRegistryValuesDashboardConfig } from '../../../common/dashboards/dashboard-definitions/overview/fim/registry-values/dashboard';
import {
  GDPROverviewDashboardConfig,
} from '../../../common/dashboards/dashboard-definitions/overview/gdpr/overview/dashboard';
import { GDPRPinnedAgentDashboardConfig } from "../../../common/dashboards/dashboard-definitions/overview/gdpr/pinned-agent/dashboard";
import { GithubDrilldownActionDashboardConfig } from '../../../common/dashboards/dashboard-definitions/overview/github/drilldowns/action/dashboard';
import { GithubDrilldownActorDashboardConfig } from '../../../common/dashboards/dashboard-definitions/overview/github/drilldowns/actor/dashboard';
import { GithubDrilldownOrganizationDashboardConfig } from '../../../common/dashboards/dashboard-definitions/overview/github/drilldowns/organization/dashboard';
import { GithubDrilldownRepositoryDashboardConfig } from '../../../common/dashboards/dashboard-definitions/overview/github/drilldowns/repository/dashboard';
import {
  GithubOverviewDashboardConfig,
} from '../../../common/dashboards/dashboard-definitions/overview/github/overview/dashboard';
import { GithubPinnedAgentDashboardConfig } from "../../../common/dashboards/dashboard-definitions/overview/github/pinned-agent/dashboard";
import {
  GoogleCloudOverviewDashboardConfig,
} from '../../../common/dashboards/dashboard-definitions/overview/google-cloud/overview/dashboard';
import { GoogleCloudPinnedAgentDashboardConfig } from "../../../common/dashboards/dashboard-definitions/overview/google-cloud/pinned-agent/dashboard";
import {
  HipaaOverviewDashboardConfig,
} from '../../../common/dashboards/dashboard-definitions/overview/hipaa/overview/dashboard';
import { HipaaPinnedAgentDashboardConfig } from "../../../common/dashboards/dashboard-definitions/overview/hipaa/pinned-agent/dashboard";
import { ITHygieneOverviewDashboardConfig } from '../../../common/dashboards/dashboard-definitions/overview/it-hygiene/dashboards/overview/dashboard';
import { ITHygienePinnedAgentDashboardConfig } from "../../../common/dashboards/dashboard-definitions/overview/it-hygiene/dashboards/pinned-agent/dashboard";
import { ITHygieneKPIsDashboardConfig } from '../../../common/dashboards/dashboard-definitions/overview/it-hygiene/kpis/dashboard';
import { ITHygieneNetworksInventoriesInterfacesDashboardConfig } from '../../../common/dashboards/dashboard-definitions/overview/it-hygiene/networks/inventories/interfaces/dashboard';
import { ITHygieneNetworksInventoriesNetworksDashboardConfig } from '../../../common/dashboards/dashboard-definitions/overview/it-hygiene/networks/inventories/networks/dashboard';
import { ITHygieneNetworksInventoriesProtocolsDashboardConfig } from '../../../common/dashboards/dashboard-definitions/overview/it-hygiene/networks/inventories/protocols/dashboard';
import { ITHygieneNetworksInventoriesServicesDashboardConfig } from '../../../common/dashboards/dashboard-definitions/overview/it-hygiene/networks/inventories/services/dashboard';
import { ITHygieneNetworksInventoriesTrafficDashboardConfig } from '../../../common/dashboards/dashboard-definitions/overview/it-hygiene/networks/inventories/traffic/dashboard';
import { ITHygienePackagesInventoriesBrowserExtensionsDashboardConfig } from '../../../common/dashboards/dashboard-definitions/overview/it-hygiene/packages/inventories/browser-extensions/dashboard';
import { ITHygienePackagesInventoriesHotFixesDashboardConfig } from '../../../common/dashboards/dashboard-definitions/overview/it-hygiene/packages/inventories/hotfixes/dashboard';
import { ITHygienePackagesInventoriesPackagesDashboardConfig } from '../../../common/dashboards/dashboard-definitions/overview/it-hygiene/packages/inventories/packages/dashboard';
import { ITHygieneProcessesDashboardConfig } from '../../../common/dashboards/dashboard-definitions/overview/it-hygiene/processes/dashboard';
import { ITHygieneServicesDashboardConfig } from '../../../common/dashboards/dashboard-definitions/overview/it-hygiene/services/dashboard';
import { ITHygieneSystemInventoriesHardwareDashboardConfig } from '../../../common/dashboards/dashboard-definitions/overview/it-hygiene/system/inventories/hardware/dashboard';
import { ITHygieneSystemInventoriesSystemDashboardConfig } from '../../../common/dashboards/dashboard-definitions/overview/it-hygiene/system/inventories/system/dashboard';
import { ITHygieneTablesDashboardConfig } from '../../../common/dashboards/dashboard-definitions/overview/it-hygiene/tables/dashboard';
import { ITHygieneUsersInventoriesGroupsDashboardConfig } from '../../../common/dashboards/dashboard-definitions/overview/it-hygiene/users/inventories/groups/dashboard';
import { ITHygieneUsersInventoriesUsersDashboardConfig } from '../../../common/dashboards/dashboard-definitions/overview/it-hygiene/users/inventories/users/dashboard';
import {
  MalwareDetectionOverviewDashboardConfig,
} from '../../../common/dashboards/dashboard-definitions/overview/malware-detection/overview/dashboard';
import { MalwareDetectionPinnedAgentDashboardConfig } from "../../../common/dashboards/dashboard-definitions/overview/malware-detection/pinned-agent/dashboard";
import {
  MitreOverviewDashboardConfig,
} from '../../../common/dashboards/dashboard-definitions/overview/mitre/overview/dashboard';
import { MitrePinnedAgentDashboardConfig } from "../../../common/dashboards/dashboard-definitions/overview/mitre/pinned-agent/dashboard";
import {
  NistOverviewDashboardConfig,
} from '../../../common/dashboards/dashboard-definitions/overview/nist/overview/dashboard';
import { NistPinnedAgentDashboardConfig } from "../../../common/dashboards/dashboard-definitions/overview/nist/pinned-agent/dashboard";
import { OfficeDrilldownIPConfigDashboardConfig } from '../../../common/dashboards/dashboard-definitions/overview/office/drilldowns/ip-config/dashboard';
import { OfficeDrilldownOperationsDashboardConfig } from '../../../common/dashboards/dashboard-definitions/overview/office/drilldowns/operations-config/dashboard';
import { OfficeDrilldownRulesConfigDashboardConfig } from '../../../common/dashboards/dashboard-definitions/overview/office/drilldowns/rules-config/dashboard';
import { OfficeDrilldownUserConfigDashboardConfig } from '../../../common/dashboards/dashboard-definitions/overview/office/drilldowns/user-config/dashboard';
import { OfficeKPIsDashboardConfig } from '../../../common/dashboards/dashboard-definitions/overview/office/kpis/dashboard';
import { OfficeOverviewDashboardConfig } from '../../../common/dashboards/dashboard-definitions/overview/office/overview/dashboard';
import {
  PCIOverviewDashboardConfig,
} from '../../../common/dashboards/dashboard-definitions/overview/pci/overview/dashboard';
import { PCIPinnedAgentDashboardConfig } from "../../../common/dashboards/dashboard-definitions/overview/pci/pinned-agent/dashboard";
import { SCAInventoryDashboardConfig } from '../../../common/dashboards/dashboard-definitions/overview/sca/inventory/dashboard';
import { SCAKPIsDashboardConfig } from '../../../common/dashboards/dashboard-definitions/overview/sca/kpis/dashboard';
import { SCAOverviewDashboardConfig } from '../../../common/dashboards/dashboard-definitions/overview/sca/overview/dashboard';
import { SCATablesDashboardConfig } from '../../../common/dashboards/dashboard-definitions/overview/sca/tables/dashboard';
import { ThreatHuntingKPIsDashboardConfig } from '../../../common/dashboards/dashboard-definitions/overview/threat-hunting/kpis/dashboard';
import { ThreatHuntingOverviewDashboardConfig } from '../../../common/dashboards/dashboard-definitions/overview/threat-hunting/overview/dashboard';
import { ThreatHuntingPinnedAgentDashboardConfig } from "../../../common/dashboards/dashboard-definitions/overview/threat-hunting/pinned-agent/dashboard";
import {
  TscOverviewDashboardConfig,
} from '../../../common/dashboards/dashboard-definitions/overview/tsc/overview/dashboard';
import { TscPinnedAgentDashboardConfig } from "../../../common/dashboards/dashboard-definitions/overview/tsc/pinned-agent/dashboard";
import { VulnerabilitiesFiltersDashboardConfig } from '../../../common/dashboards/dashboard-definitions/overview/vulnerabilities/filters/dashboard';
import { VulnerabilitiesKPIsDashboardConfig } from '../../../common/dashboards/dashboard-definitions/overview/vulnerabilities/kpis/dashboard';
import { VulnerabilitiesOverviewDashboardConfig } from '../../../common/dashboards/dashboard-definitions/overview/vulnerabilities/overview/dashboard';
import { WazuhDiscoverDashboardConfig } from '../../../common/dashboards/dashboard-definitions/wazuh-discover/events/dashboard';
import { INDEX_PATTERN_REPLACE_ME } from './constants';

export const getDashboardConfigs = (): DashboardConfig[] => {

  return [
    new AgentsEventsDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new AWSOverviewDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new AWSPinnedAgentDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new AzureOverviewDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new AzurePinnedAgentDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new DockerOverviewDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new DockerPinnedAgentDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new FimFilesDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new FimOverviewDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new FimPinnedAgentDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new FimRegistryKeysDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new FimRegistryValuesDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new GDPROverviewDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new GDPRPinnedAgentDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new GithubDrilldownActionDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new GithubDrilldownActorDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new GithubDrilldownOrganizationDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new GithubDrilldownRepositoryDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new GithubOverviewDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new GithubPinnedAgentDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new GoogleCloudOverviewDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new GoogleCloudPinnedAgentDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new HipaaOverviewDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new HipaaPinnedAgentDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new ITHygieneKPIsDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new ITHygieneNetworksInventoriesInterfacesDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new ITHygieneNetworksInventoriesNetworksDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new ITHygieneNetworksInventoriesProtocolsDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new ITHygieneNetworksInventoriesServicesDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new ITHygieneNetworksInventoriesTrafficDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new ITHygieneOverviewDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new ITHygienePackagesInventoriesBrowserExtensionsDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new ITHygienePackagesInventoriesHotFixesDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new ITHygienePackagesInventoriesPackagesDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new ITHygienePinnedAgentDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new ITHygieneProcessesDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new ITHygieneServicesDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new ITHygieneSystemInventoriesHardwareDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new ITHygieneSystemInventoriesSystemDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new ITHygieneTablesDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new ITHygieneUsersInventoriesGroupsDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new ITHygieneUsersInventoriesUsersDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new MalwareDetectionOverviewDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new MalwareDetectionPinnedAgentDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new MitreOverviewDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new MitrePinnedAgentDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new NistOverviewDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new NistPinnedAgentDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new OfficeDrilldownIPConfigDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new OfficeDrilldownOperationsDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new OfficeDrilldownRulesConfigDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new OfficeDrilldownUserConfigDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new OfficeKPIsDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new OfficeOverviewDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new PCIOverviewDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new PCIPinnedAgentDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new SCAInventoryDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new SCAKPIsDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new SCAOverviewDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new SCATablesDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new ThreatHuntingKPIsDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new ThreatHuntingOverviewDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new ThreatHuntingPinnedAgentDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new TscOverviewDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new TscPinnedAgentDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new VulnerabilitiesFiltersDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new VulnerabilitiesKPIsDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new VulnerabilitiesOverviewDashboardConfig(INDEX_PATTERN_REPLACE_ME),
    new WazuhDiscoverDashboardConfig(INDEX_PATTERN_REPLACE_ME),
  ];
};
