/*
 * Wazuh app - Simple description for each App tabs
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { MainSca } from '../../agents/sca';
import { MainMitre } from './main-mitre';
import { ModuleMitreAttackIntelligence } from '../../overview/mitre/intelligence';
import { ComplianceTable } from '../../overview/compliance-table';
import { ButtonModuleGenerateReport } from '../modules/buttons';
import { OfficePanel } from '../../overview/office/panel';
import { GitHubPanel } from '../../overview/github/panel';
import {
  WazuhDiscover,
  WazuhDiscoverProps,
} from '../wazuh-discover/wz-discover';
import { threatHuntingColumns } from '../wazuh-discover/config/data-grid-columns';
import { vulnerabilitiesColumns } from '../../overview/vulnerabilities/events/vulnerabilities-columns';
import React from 'react';
import { dockerColumns } from '../../overview/docker/events/docker-columns';
import { googleCloudColumns } from '../../overview/google-cloud/events/google-cloud-columns';
import { amazonWebServicesColumns } from '../../overview/amazon-web-services/events/amazon-web-services-columns';
import { office365Columns } from '../../overview/office/events/office-365-columns';
import { fileIntegrityMonitoringColumns } from '../../overview/fim/events/file-integrity-monitoring-columns';
import { configurationAssessmentColumns } from '../../agents/sca/events/configuration-assessment-columns';
import { pciColumns } from '../../overview/pci/events/pci-columns';
import { hipaaColumns } from '../../overview/hipaa/events/hipaa-columns';
import { nistColumns } from '../../overview/nist/events/nist-columns';
import { gdprColumns } from '../../overview/gdpr/events/gdpr-columns';
import { tscColumns } from '../../overview/tsc/events/tsc-columns';
import { githubColumns } from '../../overview/github/events/github-columns';
import { mitreAttackColumns } from '../../overview/mitre/events/mitre-attack-columns';
import { malwareDetectionColumns } from '../../overview/malware-detection/events/malware-detection-columns';
import { azureColumns } from '../../overview/azure/events/azure-columns';
import {
  WAZUH_SAMPLE_ALERTS_CATEGORY_AUDITING_POLICY_MONITORING,
  WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY,
  WAZUH_SAMPLE_ALERTS_CATEGORY_THREAT_DETECTION,
  WAZUH_VULNERABILITIES_PATTERN,
} from '../../../../common/constants';
import {
  DashboardGitHub,
  DashboardGDPR,
  DashboardPCIDSS,
  DashboardDocker,
  DashboardMalwareDetection,
  DashboardFIM,
  DashboardNIST80053,
  DashboardHIPAA,
  DashboardTSC,
  DashboardMITRE,
  DashboardAWS,
  DashboardOffice365,
  DashboardThreatHunting,
  DashboardGoogleCloud,
  DashboardVuls,
  InventoryVuls,
  DashboardAzure,
} from '../../overview';
import {
  DockerDataSource,
  AlertsVulnerabilitiesDataSource,
  AWSDataSource,
  FIMDataSource,
  GitHubDataSource,
  MalwareDetectionDataSource,
  TSCDataSource,
  GoogleCloudDataSource,
  NIST80053DataSource,
  MitreAttackDataSource,
  GDPRDataSource,
  ConfigurationAssessmentDataSource,
  HIPAADataSource,
  PCIDSSDataSource,
  Office365DataSource,
  ThreatHuntingDataSource,
  AzureDataSource,
} from '../data-source';
import { ButtonExploreAgent } from '../../wz-agent-selector/button-explore-agent';
import {
  DashboardITHygiene,
  ITHygieneNetworksInventory,
  ITHygienePackagesInventory,
  ITHygieneProcessesInventory,
  ITHygieneSystemInventory,
} from '../../overview/it-hygiene';
import { InventoryFIM } from '../../overview/fim';

const renderDiscoverTab = (props: WazuhDiscoverProps) => {
  return {
    id: 'events',
    name: 'Events',
    buttons: [ButtonExploreAgent],
    component: () => <WazuhDiscover {...props} />,
  };
};

export const ModulesDefaults = {
  general: {
    init: 'events',
    tabs: [
      {
        id: 'dashboard',
        name: 'Dashboard',
        buttons: [ButtonExploreAgent, ButtonModuleGenerateReport],
        component: DashboardThreatHunting,
      },
      renderDiscoverTab({
        moduleId: 'threat-hunting',
        tableColumns: threatHuntingColumns,
        DataSource: ThreatHuntingDataSource,
        categoriesSampleData: [
          WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY,
          WAZUH_SAMPLE_ALERTS_CATEGORY_AUDITING_POLICY_MONITORING,
          WAZUH_SAMPLE_ALERTS_CATEGORY_THREAT_DETECTION,
        ],
      }),
    ],
    availableFor: ['manager', 'agent'],
  },
  fim: {
    init: 'dashboard',
    tabs: [
      {
        id: 'dashboard',
        name: 'Dashboard',
        buttons: [ButtonExploreAgent, ButtonModuleGenerateReport],
        component: DashboardFIM,
      },
      {
        id: 'inventory',
        name: 'Inventory',
        buttons: [ButtonExploreAgent],
        component: InventoryFIM,
      },
      renderDiscoverTab({
        moduleId: 'fim',
        tableColumns: fileIntegrityMonitoringColumns,
        DataSource: FIMDataSource,
        categoriesSampleData: [WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY],
      }),
    ],
    availableFor: ['manager', 'agent'],
  },
  azure: {
    init: 'dashboard',
    tabs: [
      {
        id: 'dashboard',
        name: 'Dashboard',
        buttons: [ButtonExploreAgent, ButtonModuleGenerateReport],
        component: DashboardAzure,
      },
      renderDiscoverTab({
        moduleId: 'azure',
        tableColumns: azureColumns,
        DataSource: AzureDataSource,
        categoriesSampleData: [WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY], // TODO: Change this when sample data is available for Azure
      }),
    ],
    availableFor: ['manager', 'agent'],
  },
  aws: {
    init: 'dashboard',
    tabs: [
      {
        id: 'dashboard',
        name: 'Dashboard',
        buttons: [ButtonExploreAgent, ButtonModuleGenerateReport],
        component: DashboardAWS,
      },
      renderDiscoverTab({
        moduleId: 'aws',
        tableColumns: amazonWebServicesColumns,
        DataSource: AWSDataSource,
        categoriesSampleData: [WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY],
      }),
    ],
    availableFor: ['manager', 'agent'],
  },
  gcp: {
    init: 'dashboard',
    tabs: [
      {
        id: 'dashboard',
        name: 'Dashboard',
        component: DashboardGoogleCloud,
        buttons: [ButtonExploreAgent, ButtonModuleGenerateReport],
      },
      renderDiscoverTab({
        moduleId: 'gcp',
        tableColumns: googleCloudColumns,
        DataSource: GoogleCloudDataSource,
        categoriesSampleData: [WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY],
      }),
    ],
    availableFor: ['manager', 'agent'],
  },
  // This module is Malware Detection. Ref: https://github.com/wazuh/wazuh-dashboard-plugins/issues/5893
  pm: {
    init: 'dashboard',
    tabs: [
      {
        id: 'dashboard',
        name: 'Dashboard',
        buttons: [ButtonExploreAgent, ButtonModuleGenerateReport],
        component: DashboardMalwareDetection,
      },
      renderDiscoverTab({
        moduleId: 'pm',
        tableColumns: malwareDetectionColumns,
        DataSource: MalwareDetectionDataSource,
        categoriesSampleData: [
          WAZUH_SAMPLE_ALERTS_CATEGORY_AUDITING_POLICY_MONITORING,
        ],
      }),
    ],
    availableFor: ['manager', 'agent'],
  },
  sca: {
    init: 'dashboard',
    tabs: [
      {
        id: 'dashboard',
        name: 'Dashboard',
        buttons: [ButtonExploreAgent],
        component: MainSca,
      },
      {
        id: 'inventory',
        name: 'Inventory',
        buttons: [ButtonExploreAgent],
        component: MainSca,
      },
      renderDiscoverTab({
        moduleId: 'sca',
        tableColumns: configurationAssessmentColumns,
        DataSource: ConfigurationAssessmentDataSource,
        categoriesSampleData: [],
      }),
    ],
    buttons: ['settings'],
    availableFor: ['manager', 'agent'],
  },
  office: {
    init: 'dashboard',
    tabs: [
      {
        id: 'dashboard',
        name: 'Dashboard',
        component: DashboardOffice365,
        buttons: [ButtonExploreAgent, ButtonModuleGenerateReport],
      },
      {
        id: 'inventory',
        name: 'Panel',
        buttons: [ButtonExploreAgent],
        component: OfficePanel,
      },
      renderDiscoverTab({
        moduleId: 'office',
        tableColumns: office365Columns,
        DataSource: Office365DataSource,
        categoriesSampleData: [WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY],
      }),
    ],
    availableFor: ['manager', 'agent'],
  },
  github: {
    init: 'dashboard',
    tabs: [
      {
        id: 'dashboard',
        name: 'Dashboard',
        buttons: [ButtonExploreAgent, ButtonModuleGenerateReport],
        component: DashboardGitHub,
      },
      {
        id: 'inventory',
        name: 'Panel',
        buttons: [ButtonExploreAgent],
        component: GitHubPanel,
      },
      renderDiscoverTab({
        moduleId: 'github',
        tableColumns: githubColumns,
        DataSource: GitHubDataSource,
        categoriesSampleData: [WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY],
      }),
    ],
    availableFor: ['manager', 'agent'],
  },
  vuls: {
    init: 'dashboard',
    tabs: [
      {
        id: 'dashboard',
        name: 'Dashboard',
        component: DashboardVuls,
        /* For ButtonExploreAgent to insert correctly according to the module's index pattern, the moduleIndexPatternTitle parameter is added. By default it applies the index patternt wazuh-alerts-* */
        buttons: [
          ({ ...props }) => (
            <ButtonExploreAgent
              {...props}
              moduleIndexPatternTitle={WAZUH_VULNERABILITIES_PATTERN}
            />
          ),
        ],
      },
      {
        id: 'inventory',
        name: 'Inventory',
        component: InventoryVuls,
        /* For ButtonExploreAgent to insert correctly according to the module's index pattern, the moduleIndexPatternTitle parameter is added. By default it applies the index patternt wazuh-alerts-* */
        buttons: [
          ({ ...props }) => (
            <ButtonExploreAgent
              {...props}
              moduleIndexPatternTitle={WAZUH_VULNERABILITIES_PATTERN}
            />
          ),
        ],
      },
      renderDiscoverTab({
        moduleId: 'vuls',
        tableColumns: vulnerabilitiesColumns,
        DataSource: AlertsVulnerabilitiesDataSource,
        categoriesSampleData: [WAZUH_SAMPLE_ALERTS_CATEGORY_THREAT_DETECTION],
      }),
    ],
    buttons: ['settings'],
    availableFor: ['manager', 'agent'],
  },
  mitre: {
    init: 'dashboard',
    tabs: [
      {
        id: 'dashboard',
        name: 'Dashboard',
        buttons: [ButtonExploreAgent, ButtonModuleGenerateReport],
        component: DashboardMITRE,
      },
      {
        id: 'intelligence',
        name: 'Intelligence',
        component: ModuleMitreAttackIntelligence,
      },
      {
        id: 'inventory',
        name: 'Framework',
        buttons: [ButtonExploreAgent],
        component: MainMitre,
      },
      renderDiscoverTab({
        moduleId: 'mitre',
        DataSource: MitreAttackDataSource,
        tableColumns: mitreAttackColumns,
        categoriesSampleData: [
          WAZUH_SAMPLE_ALERTS_CATEGORY_THREAT_DETECTION,
          WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY,
        ],
      }),
    ],
    availableFor: ['manager', 'agent'],
  },
  docker: {
    init: 'dashboard',
    tabs: [
      {
        id: 'dashboard',
        name: 'Dashboard',
        buttons: [ButtonExploreAgent, ButtonModuleGenerateReport],
        component: DashboardDocker,
      },
      renderDiscoverTab({
        moduleId: 'docker',
        tableColumns: dockerColumns,
        DataSource: DockerDataSource,
        categoriesSampleData: [WAZUH_SAMPLE_ALERTS_CATEGORY_THREAT_DETECTION],
      }),
    ],
    availableFor: ['manager', 'agent'],
  },
  pci: {
    init: 'dashboard',
    tabs: [
      {
        id: 'dashboard',
        name: 'Dashboard',
        buttons: [ButtonExploreAgent, ButtonModuleGenerateReport],
        component: DashboardPCIDSS,
      },
      {
        id: 'inventory',
        name: 'Controls',
        buttons: [ButtonExploreAgent],
        component: props => (
          <ComplianceTable {...props} DataSource={PCIDSSDataSource} />
        ),
      },
      renderDiscoverTab({
        moduleId: 'pci',
        tableColumns: pciColumns,
        DataSource: PCIDSSDataSource,
        categoriesSampleData: [WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY],
      }),
    ],
    availableFor: ['manager', 'agent'],
  },
  hipaa: {
    init: 'dashboard',
    tabs: [
      {
        id: 'dashboard',
        name: 'Dashboard',
        buttons: [ButtonExploreAgent, ButtonModuleGenerateReport],
        component: DashboardHIPAA,
      },
      {
        id: 'inventory',
        name: 'Controls',
        buttons: [ButtonExploreAgent],
        component: props => (
          <ComplianceTable {...props} DataSource={HIPAADataSource} />
        ),
      },
      renderDiscoverTab({
        moduleId: 'hipaa',
        tableColumns: hipaaColumns,
        DataSource: HIPAADataSource,
        categoriesSampleData: [WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY],
      }),
    ],
    availableFor: ['manager', 'agent'],
  },
  nist: {
    init: 'dashboard',
    tabs: [
      {
        id: 'dashboard',
        name: 'Dashboard',
        buttons: [ButtonExploreAgent, ButtonModuleGenerateReport],
        component: DashboardNIST80053,
      },
      {
        id: 'inventory',
        name: 'Controls',
        buttons: [ButtonExploreAgent],
        component: props => (
          <ComplianceTable {...props} DataSource={NIST80053DataSource} />
        ),
      },
      renderDiscoverTab({
        moduleId: 'nist',
        tableColumns: nistColumns,
        DataSource: NIST80053DataSource,
        categoriesSampleData: [WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY],
      }),
    ],
    availableFor: ['manager', 'agent'],
  },
  gdpr: {
    init: 'dashboard',
    tabs: [
      {
        id: 'dashboard',
        name: 'Dashboard',
        buttons: [ButtonExploreAgent, ButtonModuleGenerateReport],
        component: DashboardGDPR,
      },
      {
        id: 'inventory',
        name: 'Controls',
        buttons: [ButtonExploreAgent],
        component: props => (
          <ComplianceTable {...props} DataSource={GDPRDataSource} />
        ),
      },
      renderDiscoverTab({
        moduleId: 'gdpr',
        tableColumns: gdprColumns,
        DataSource: GDPRDataSource,
        categoriesSampleData: [WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY],
      }),
    ],
    availableFor: ['manager', 'agent'],
  },
  tsc: {
    init: 'dashboard',
    tabs: [
      {
        id: 'dashboard',
        name: 'Dashboard',
        buttons: [ButtonExploreAgent, ButtonModuleGenerateReport],
        component: DashboardTSC,
      },
      {
        id: 'inventory',
        name: 'Controls',
        buttons: [ButtonExploreAgent],
        component: props => (
          <ComplianceTable {...props} DataSource={TSCDataSource} />
        ),
      },
      renderDiscoverTab({
        moduleId: 'tsc',
        tableColumns: tscColumns,
        DataSource: TSCDataSource,
        categoriesSampleData: [WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY],
      }),
    ],
    availableFor: ['manager', 'agent'],
  },
  'it-hygiene': {
    init: 'dashboard',
    tabs: [
      {
        id: 'dashboard',
        name: 'Dashboard',
        buttons: [ButtonExploreAgent, ButtonModuleGenerateReport],
        component: DashboardITHygiene,
      },
      {
        id: 'networks',
        name: 'Networks',
        buttons: [ButtonExploreAgent],
        component: ITHygieneNetworksInventory,
      },
      {
        id: 'processes',
        name: 'Processes',
        buttons: [ButtonExploreAgent],
        component: ITHygieneProcessesInventory,
      },
      {
        id: 'packages',
        name: 'Packages',
        buttons: [ButtonExploreAgent],
        component: ITHygienePackagesInventory,
      },
      {
        id: 'system',
        name: 'System',
        buttons: [ButtonExploreAgent],
        component: ITHygieneSystemInventory,
      },
    ],
    availableFor: ['manager', 'agent'],
  },
  software: {
    notModule: true,
  },
  network: {
    notModule: true,
  },
  processes: {
    notModule: true,
  },
  configuration: {
    notModule: true,
  },
  stats: {
    notModule: true,
  },
};
