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
import { caseManagementDocumentDetailsTabs as findingsDocumentDetailsTabs } from '../document-details/case-management';
import { threatHuntingColumns } from '../../overview/threat-hunting/events/threat-hunting-columns';
import { ThreatHuntingCases } from '../../overview';
import { vulnerabilitiesColumns } from '../../overview/vulnerabilities/events/vulnerabilities-columns';
import { dockerColumns } from '../../overview/docker/events/docker-columns';
import { googleCloudColumns } from '../../overview/google-cloud/events/google-cloud-columns';
import { amazonWebServicesColumns } from '../../overview/amazon-web-services/events/amazon-web-services-columns';
import { office365Columns } from '../../overview/office/events/office-365-columns';
import { fileIntegrityMonitoringColumns } from '../../overview/fim/events/file-integrity-monitoring-columns';
import { configurationAssessmentColumns } from '../../overview/sca/events/configuration-assessment-columns';
import { createRegulatoryComplianceColumns } from '../../overview/regulatory-compliance/shared/create-regulatory-compliance-columns';
import { githubColumns } from '../../overview/github/events/github-columns';
import { mitreAttackColumns } from '../../overview/mitre/events/mitre-attack-columns';
import { malwareDetectionColumns } from '../../overview/malware-detection/events/malware-detection-columns';
import { activeResponsesColumns } from '../../overview/active-responses/events/active-responses-columns';
import { ActiveResponseFlyoutBody } from '../../overview/active-responses/events/active-response-flyout-body';
import { azureColumns } from '../../overview/azure/events/azure-columns';
import {
  TAB_VIEW_ID_DASHBOARD,
  TAB_VIEW_ID_EVENTS,
  TAB_VIEW_ID_RESPONSES,
  TAB_VIEW_NAME_DASHBOARD,
  TAB_VIEW_NAME_EVENTS,
  TAB_VIEW_NAME_RESPONSES,
  WAZUH_MODULES_ID,
  WAZUH_SAMPLE_ALERTS_CATEGORY_AUDITING_POLICY_MONITORING,
  WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY,
  WAZUH_SAMPLE_ALERTS_CATEGORY_THREAT_DETECTION,
  WAZUH_VULNERABILITIES_PATTERN,
  WAZUH_ACTIVE_RESPONSES_PATTERN,
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
  DashboardActiveResponses,
} from '../../overview';
import {
  DockerDataSource,
  AlertsVulnerabilitiesDataSource,
  AWSDataSource,
  FIMFindingsDataSource,
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
  ActiveResponsesDataSource,
  ActiveResponsesDataSourceRepository,
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
  RegulatoryComplianceCMMC,
  RegulatoryComplianceFedRAMP,
  RegulatoryComplianceGDPR,
  RegulatoryComplianceHIPAA,
  RegulatoryComplianceISO27001,
  RegulatoryComplianceNIS2,
  RegulatoryComplianceNIST800171,
  RegulatoryComplianceNIST80053,
  RegulatoryCompliancePCIDSS,
  RegulatoryComplianceTSC,
} from '../../overview/regulatory-compliance';
import { InventoryFIM } from '../../overview/fim';
import { SCAInventory, SCADashboard } from '../../overview/sca';
import { ReportingService } from '../../../react-services';
import { WAZUH_MODULES } from '../../../../common/wazuh-modules';

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

/**
 * Renders a findings discover tab with the shared Case management tab in its
 * Document details flyout, available for all modules backed by wazuh-findings-v5*
 * indices (see wazuh-indexer-plugins#1220). The case tab lets analysts triage and
 * annotate individual findings directly from the flyout without leaving the dashboard.
 */
const renderFindingsDiscoverTab = (
  props: WazuhDiscoverProps,
): ReturnType<typeof renderDiscoverTab> =>
  renderDiscoverTab({
    ...props,
    additionalDocumentDetailsTabs: findingsDocumentDetailsTabs,
  });

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
      renderFindingsDiscoverTab({
        moduleId: 'threat-hunting',
        tableColumns: threatHuntingColumns,
        DataSource: ThreatHuntingDataSource,
        categoriesSampleData: [
          WAZUH_SAMPLE_ALERTS_CATEGORY_SECURITY,
          WAZUH_SAMPLE_ALERTS_CATEGORY_AUDITING_POLICY_MONITORING,
          WAZUH_SAMPLE_ALERTS_CATEGORY_THREAT_DETECTION,
        ],
      }),
      {
        id: 'cases',
        name: 'Cases',
        buttons: [ButtonExploreAgent],
        component: ThreatHuntingCases,
      },
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
      renderFindingsDiscoverTab({
        moduleId: 'fim',
        tableColumns: fileIntegrityMonitoringColumns,
        DataSource: FIMFindingsDataSource,
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
      renderFindingsDiscoverTab({
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
      renderFindingsDiscoverTab({
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
      renderFindingsDiscoverTab({
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
      renderFindingsDiscoverTab({
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
      renderFindingsDiscoverTab({
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
      renderFindingsDiscoverTab({
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
      renderFindingsDiscoverTab({
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
        /* For ButtonExploreAgent to insert correctly according to the module's index pattern, the moduleIndexPatternTitle parameter is added. By default it applies the index pattern wazuh-events-v5* */
        buttons: [
          ({ ...props }) => (
            <ButtonExploreAgent
              {...props}
              moduleIndexPatternTitle={WAZUH_VULNERABILITIES_PATTERN}
            />
          ),
          ButtonModuleGenerateReport,
        ],
      },
      {
        id: 'inventory',
        name: 'Inventory',
        component: InventoryVuls,
        /* For ButtonExploreAgent to insert correctly according to the module's index pattern, the moduleIndexPatternTitle parameter is added. By default it applies the index pattern wazuh-events-v5* */
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
      renderFindingsDiscoverTab({
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
      renderFindingsDiscoverTab({
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
      renderFindingsDiscoverTab({
        moduleId: 'pci',
        tableColumns: createRegulatoryComplianceColumns(
          'wazuh.rule.compliance.pci_dss',
          300,
        ),
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
      renderFindingsDiscoverTab({
        moduleId: 'hipaa',
        tableColumns: createRegulatoryComplianceColumns(
          'wazuh.rule.compliance.hipaa',
        ),
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
      renderFindingsDiscoverTab({
        moduleId: 'nist',
        tableColumns: createRegulatoryComplianceColumns(
          'wazuh.rule.compliance.nist_800_53',
          300,
        ),
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
      renderFindingsDiscoverTab({
        moduleId: 'gdpr',
        tableColumns: createRegulatoryComplianceColumns(
          'wazuh.rule.compliance.gdpr',
        ),
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
      renderFindingsDiscoverTab({
        moduleId: 'tsc',
        tableColumns: createRegulatoryComplianceColumns(
          'wazuh.rule.compliance.tsc',
        ),
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
  'active-response-dashboard': {
    init: TAB_VIEW_ID_DASHBOARD,
    tabs: [
      {
        id: TAB_VIEW_ID_DASHBOARD,
        name: TAB_VIEW_NAME_DASHBOARD,
        buttons: [
          ({ ...props }) => (
            <ButtonExploreAgent
              {...props}
              moduleIndexPatternTitle={WAZUH_ACTIVE_RESPONSES_PATTERN}
            />
          ),
          ButtonModuleGenerateReport,
        ],
        component: DashboardActiveResponses,
      },
      {
        id: TAB_VIEW_ID_RESPONSES,
        name: TAB_VIEW_NAME_RESPONSES,
        buttons: [
          ({ ...props }) => (
            <ButtonExploreAgent
              {...props}
              moduleIndexPatternTitle={WAZUH_ACTIVE_RESPONSES_PATTERN}
            />
          ),
        ],
        component: () => (
          <WazuhDiscover
            moduleId='active-response-dashboard-responses'
            tableColumns={activeResponsesColumns}
            DataSource={ActiveResponsesDataSource}
            DataSourceRepository={ActiveResponsesDataSourceRepository}
            categoriesSampleData={[]}
            flyoutTitle='Active response details'
            additionalDocumentDetailsTabs={({ document }) => [
              {
                id: 'source-finding',
                name: 'Source finding',
                content: <ActiveResponseFlyoutBody hit={document} />,
              },
            ]}
          />
        ),
      },
    ],
    availableFor: ['manager', 'agent'],
  },
  'regulatory-compliance': {
    init: 'pci-dss',
    tabs: [
      {
        id: WAZUH_MODULES_ID.PCI_DSS,
        name: WAZUH_MODULES[WAZUH_MODULES_ID.PCI_DSS].title,
        buttons: [ButtonExploreAgent],
        component: RegulatoryCompliancePCIDSS,
      },
      {
        id: WAZUH_MODULES_ID.CMMC,
        name: WAZUH_MODULES[WAZUH_MODULES_ID.CMMC].title,
        buttons: [ButtonExploreAgent],
        component: RegulatoryComplianceCMMC,
      },
      {
        id: WAZUH_MODULES_ID.FEDRAMP,
        name: WAZUH_MODULES[WAZUH_MODULES_ID.FEDRAMP].title,
        buttons: [ButtonExploreAgent],
        component: RegulatoryComplianceFedRAMP,
      },
      {
        id: WAZUH_MODULES_ID.GDPR,
        name: WAZUH_MODULES[WAZUH_MODULES_ID.GDPR].title,
        buttons: [ButtonExploreAgent],
        component: RegulatoryComplianceGDPR,
      },
      {
        id: WAZUH_MODULES_ID.HIPAA,
        name: WAZUH_MODULES[WAZUH_MODULES_ID.HIPAA].title,
        buttons: [ButtonExploreAgent],
        component: RegulatoryComplianceHIPAA,
      },
      {
        id: WAZUH_MODULES_ID.ISO_27001,
        name: WAZUH_MODULES[WAZUH_MODULES_ID.ISO_27001].title,
        buttons: [ButtonExploreAgent],
        component: RegulatoryComplianceISO27001,
      },
      {
        id: WAZUH_MODULES_ID.NIS2,
        name: WAZUH_MODULES[WAZUH_MODULES_ID.NIS2].title,
        buttons: [ButtonExploreAgent],
        component: RegulatoryComplianceNIS2,
      },
      {
        id: WAZUH_MODULES_ID.NIST_800_53,
        name: WAZUH_MODULES[WAZUH_MODULES_ID.NIST_800_53].title,
        buttons: [ButtonExploreAgent],
        component: RegulatoryComplianceNIST80053,
      },
      {
        id: WAZUH_MODULES_ID.NIST_800_171,
        name: WAZUH_MODULES[WAZUH_MODULES_ID.NIST_800_171].title,
        buttons: [ButtonExploreAgent],
        component: RegulatoryComplianceNIST800171,
      },
      {
        id: WAZUH_MODULES_ID.TSC,
        name: WAZUH_MODULES[WAZUH_MODULES_ID.TSC].title,
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
