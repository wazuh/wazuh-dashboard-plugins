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
import React from 'react';
import { MainMitre } from './main-mitre';
import { ModuleMitreAttackIntelligence } from '../../overview/mitre/intelligence';
import { ComplianceTable } from '../../overview/compliance-table';
import { ButtonModuleGenerateReport as ButtonModuleGenerateReportComponent } from '../modules/buttons';
import { OfficePanel } from '../../overview/office/panel';
import { GitHubPanel } from '../../overview/github/panel';
import {
  WazuhDiscover,
  WazuhDiscoverProps,
} from '../wazuh-discover/wz-discover';
import { threatHuntingColumns } from '../wazuh-discover/config/data-grid-columns';
import { vulnerabilitiesColumns } from '../../overview/vulnerabilities/events/vulnerabilities-columns';
import { dockerColumns } from '../../overview/docker/events/docker-columns';
import { googleCloudColumns } from '../../overview/google-cloud/events/google-cloud-columns';
import { amazonWebServicesColumns } from '../../overview/amazon-web-services/events/amazon-web-services-columns';
import { office365Columns } from '../../overview/office/events/office-365-columns';
import { fileIntegrityMonitoringColumns } from '../../overview/fim/events/file-integrity-monitoring-columns';
import { configurationAssessmentColumns } from '../../overview/sca/events/configuration-assessment-columns';
import { pciColumns } from '../../overview/regulatory-compliance/pci/events/pci-columns';
import { hipaaColumns } from '../../overview/regulatory-compliance/hipaa/events/hipaa-columns';
import { nistColumns } from '../../overview/regulatory-compliance/nist/events/nist-columns';
import { gdprColumns } from '../../overview/regulatory-compliance/gdpr/events/gdpr-columns';
import { tscColumns } from '../../overview/regulatory-compliance/tsc/events/tsc-columns';
import { githubColumns } from '../../overview/github/events/github-columns';
import { mitreAttackColumns } from '../../overview/mitre/events/mitre-attack-columns';
import { malwareDetectionColumns } from '../../overview/malware-detection/events/malware-detection-columns';
import { azureColumns } from '../../overview/azure/events/azure-columns';
import {
  TAB_VIEW_ID_DASHBOARD,
  TAB_VIEW_ID_EVENTS,
  TAB_VIEW_NAME_DASHBOARD,
  TAB_VIEW_NAME_EVENTS,
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
  ITHygieneUsersInventory,
  ITHygieneServicesInventory,
} from '../../overview/it-hygiene';
import {
  RegulatoryCompliancePCIDSS,
  RegulatoryComplianceGDPR,
  RegulatoryComplianceHIPAA,
  RegulatoryComplianceNIST80053,
  RegulatoryComplianceTSC,
} from '../../overview/regulatory-compliance';
import { InventoryFIM } from '../../overview/fim';
import { SCAInventory, SCADashboard } from '../../overview/sca';
import { ReportingService } from '../../../react-services';

const ButtonModuleGenerateReport = {
  condition: () => new ReportingService().reportDashboardPluginExist(),
  component: ButtonModuleGenerateReportComponent,
};

const renderDiscoverTab = (props: WazuhDiscoverProps) => {
  return {
    id: TAB_VIEW_ID_EVENTS,
    name: TAB_VIEW_NAME_EVENTS,
    buttons: [ButtonExploreAgent],
    component: () => <WazuhDiscover {...props} />,
  };
};

export const ModulesDefaults = {
  general: {
    init: TAB_VIEW_ID_DASHBOARD, // The apps define a redirection URL when accessing so this value could be ignored. There is a recovery mechanism to select an available tab if the tabView URL query parameter has a value that is not one of the availabels in the tabs IDs
    tabs: [
      {
        id: TAB_VIEW_ID_DASHBOARD,
        name: TAB_VIEW_NAME_DASHBOARD,
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
    init: TAB_VIEW_ID_DASHBOARD,
    tabs: [
      {
        id: TAB_VIEW_ID_DASHBOARD,
        name: TAB_VIEW_NAME_DASHBOARD,
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
  microsoftGraphAPI: {
    init: TAB_VIEW_ID_DASHBOARD,
    tabs: [
      {
        id: TAB_VIEW_ID_DASHBOARD,
        name: TAB_VIEW_NAME_DASHBOARD,
        buttons: [ButtonExploreAgent, ButtonModuleGenerateReport],
        component: DashboardAzure,
      },
      renderDiscoverTab({
        moduleId: 'microsoftGraphAPI',
        tableColumns: azureColumns,
        DataSource: AzureDataSource,
        categoriesSampleData: [WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY],
      }),
    ],
    availableFor: ['manager', 'agent'],
  },
  aws: {
    init: TAB_VIEW_ID_DASHBOARD,
    tabs: [
      {
        id: TAB_VIEW_ID_DASHBOARD,
        name: TAB_VIEW_NAME_DASHBOARD,
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
    init: TAB_VIEW_ID_DASHBOARD,
    tabs: [
      {
        id: TAB_VIEW_ID_DASHBOARD,
        name: TAB_VIEW_NAME_DASHBOARD,
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
    init: TAB_VIEW_ID_DASHBOARD,
    tabs: [
      {
        id: TAB_VIEW_ID_DASHBOARD,
        name: TAB_VIEW_NAME_DASHBOARD,
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
    init: TAB_VIEW_ID_DASHBOARD,
    tabs: [
      {
        id: TAB_VIEW_ID_DASHBOARD,
        name: TAB_VIEW_NAME_DASHBOARD,
        buttons: [ButtonExploreAgent],
        component: SCADashboard,
      },
      {
        id: 'inventory',
        name: 'Inventory',
        buttons: [ButtonExploreAgent],
        component: SCAInventory,
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
    init: TAB_VIEW_ID_DASHBOARD,
    tabs: [
      {
        id: TAB_VIEW_ID_DASHBOARD,
        name: TAB_VIEW_NAME_DASHBOARD,
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
    init: TAB_VIEW_ID_DASHBOARD,
    tabs: [
      {
        id: TAB_VIEW_ID_DASHBOARD,
        name: TAB_VIEW_NAME_DASHBOARD,
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
    init: TAB_VIEW_ID_DASHBOARD,
    tabs: [
      {
        id: TAB_VIEW_ID_DASHBOARD,
        name: TAB_VIEW_NAME_DASHBOARD,
        component: DashboardVuls,
        /* For ButtonExploreAgent to insert correctly according to the module's index pattern, the moduleIndexPatternTitle parameter is added. By default it applies the index pattern wazuh-events* */
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
        /* For ButtonExploreAgent to insert correctly according to the module's index pattern, the moduleIndexPatternTitle parameter is added. By default it applies the index pattern wazuh-events* */
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
    init: TAB_VIEW_ID_DASHBOARD,
    tabs: [
      {
        id: TAB_VIEW_ID_DASHBOARD,
        name: TAB_VIEW_NAME_DASHBOARD,
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
    init: TAB_VIEW_ID_DASHBOARD,
    tabs: [
      {
        id: TAB_VIEW_ID_DASHBOARD,
        name: TAB_VIEW_NAME_DASHBOARD,
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
    init: TAB_VIEW_ID_DASHBOARD,
    tabs: [
      {
        id: TAB_VIEW_ID_DASHBOARD,
        name: TAB_VIEW_NAME_DASHBOARD,
        buttons: [ButtonExploreAgent, ButtonModuleGenerateReport],
        component: DashboardPCIDSS,
      },
      {
        id: 'inventory',
        name: 'Controls',
        buttons: [ButtonExploreAgent],
        component: (props: any) => (
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
    init: TAB_VIEW_ID_DASHBOARD,
    tabs: [
      {
        id: TAB_VIEW_ID_DASHBOARD,
        name: TAB_VIEW_NAME_DASHBOARD,
        buttons: [ButtonExploreAgent, ButtonModuleGenerateReport],
        component: DashboardHIPAA,
      },
      {
        id: 'inventory',
        name: 'Controls',
        buttons: [ButtonExploreAgent],
        component: (props: any) => (
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
    init: TAB_VIEW_ID_DASHBOARD,
    tabs: [
      {
        id: TAB_VIEW_ID_DASHBOARD,
        name: TAB_VIEW_NAME_DASHBOARD,
        buttons: [ButtonExploreAgent, ButtonModuleGenerateReport],
        component: DashboardNIST80053,
      },
      {
        id: 'inventory',
        name: 'Controls',
        buttons: [ButtonExploreAgent],
        component: (props: any) => (
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
    init: TAB_VIEW_ID_DASHBOARD,
    tabs: [
      {
        id: TAB_VIEW_ID_DASHBOARD,
        name: TAB_VIEW_NAME_DASHBOARD,
        buttons: [ButtonExploreAgent, ButtonModuleGenerateReport],
        component: DashboardGDPR,
      },
      {
        id: 'inventory',
        name: 'Controls',
        buttons: [ButtonExploreAgent],
        component: (props: any) => (
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
    init: TAB_VIEW_ID_DASHBOARD,
    tabs: [
      {
        id: TAB_VIEW_ID_DASHBOARD,
        name: TAB_VIEW_NAME_DASHBOARD,
        buttons: [ButtonExploreAgent, ButtonModuleGenerateReport],
        component: DashboardTSC,
      },
      {
        id: 'inventory',
        name: 'Controls',
        buttons: [ButtonExploreAgent],
        component: (props: any) => (
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
    init: TAB_VIEW_ID_DASHBOARD,
    tabs: [
      {
        id: TAB_VIEW_ID_DASHBOARD,
        name: TAB_VIEW_NAME_DASHBOARD,
        buttons: [ButtonExploreAgent, ButtonModuleGenerateReport],
        component: DashboardITHygiene,
      },
      {
        id: 'system',
        name: 'System',
        buttons: [ButtonExploreAgent],
        component: ITHygieneSystemInventory,
      },
      {
        id: 'software',
        name: 'Software',
        buttons: [ButtonExploreAgent],
        component: ITHygienePackagesInventory,
      },
      {
        id: 'processes',
        name: 'Processes',
        buttons: [ButtonExploreAgent],
        component: ITHygieneProcessesInventory,
      },
      {
        id: 'network',
        name: 'Network',
        buttons: [ButtonExploreAgent],
        component: ITHygieneNetworksInventory,
      },
      {
        id: 'users',
        name: 'Identity',
        buttons: [ButtonExploreAgent],
        component: ITHygieneUsersInventory,
      },
      {
        id: 'services',
        name: 'Services',
        buttons: [ButtonExploreAgent],
        component: ITHygieneServicesInventory,
      },
    ],
    availableFor: ['manager', 'agent'],
  },
  'regulatory-compliance': {
    init: 'pci-dss',
    tabs: [
      {
        id: 'pci-dss',
        name: 'PCI DSS',
        buttons: [ButtonExploreAgent],
        component: RegulatoryCompliancePCIDSS,
      },
      {
        id: 'gdpr',
        name: 'GDPR',
        buttons: [ButtonExploreAgent],
        component: RegulatoryComplianceGDPR,
      },
      {
        id: 'hipaa',
        name: 'HIPAA',
        buttons: [ButtonExploreAgent],
        component: RegulatoryComplianceHIPAA,
      },
      {
        id: 'nist-800-53',
        name: 'NIST 800-53',
        buttons: [ButtonExploreAgent],
        component: RegulatoryComplianceNIST80053,
      },
      {
        id: 'tsc',
        name: 'TSC',
        buttons: [ButtonExploreAgent],
        component: RegulatoryComplianceTSC,
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
