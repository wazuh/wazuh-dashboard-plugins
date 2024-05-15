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
import { Dashboard } from './dashboard';
import { MainSca } from '../../agents/sca';
import { DashboardAWS } from '../../overview/amazon-web-services/dashboards';
import { MainMitre } from './main-mitre';
import { ModuleMitreAttackIntelligence } from '../../overview/mitre/intelligence';
import { MainFim } from '../../agents/fim';
import { ComplianceTable } from '../../overview/compliance-table';
import ButtonModuleExploreAgent from '../../../controllers/overview/components/overview-actions/overview-actions';
import { ButtonModuleGenerateReport } from '../modules/buttons';
import { OfficePanel } from '../../overview/office/panel';
import { GitHubPanel } from '../../overview/github/panel';
import { DashboardVuls, InventoryVuls } from '../../overview/vulnerabilities';
import { DashboardMITRE } from '../../overview/mitre/dashboard';
import { withModuleNotForAgent } from '../hocs';
import {
  WazuhDiscover,
  WazuhDiscoverProps,
} from '../wazuh-discover/wz-discover';
import { threatHuntingColumns } from '../wazuh-discover/config/data-grid-columns';
import { vulnerabilitiesColumns } from '../../overview/vulnerabilities/events/vulnerabilities-columns';
import { DashboardFim } from '../../overview/fim/dashboard/dashboard';
import { InventoryFim } from '../../overview/fim/inventory/inventory';
import { DashboardOffice365 } from '../../overview/office/dashboard';
import { DashboardThreatHunting } from '../../overview/threat-hunting/dashboard/dashboard';
import { DashboardVirustotal } from '../../overview/virustotal/dashboard/dashboard';
import { DashboardGoogleCloud } from '../../overview/google-cloud/dashboards';
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
import { virustotalColumns } from '../../overview/virustotal/events/virustotal-columns';
import { malwareDetectionColumns } from '../../overview/malware-detection/events/malware-detection-columns';
import { WAZUH_VULNERABILITIES_PATTERN } from '../../../../common/constants';
import { DashboardGitHub } from '../../overview/github/dashboards/dashboard';
import { DashboardGDPR } from '../../overview/gdpr/dashboards/dashboard';
import { DashboardPCIDSS } from '../../overview/pci/dashboards/dashboard';
import { DashboardDocker } from '../../overview/docker/dashboards';
import { DashboardMalwareDetection } from '../../overview/malware-detection/dashboard';
import { DashboardFIM } from '../../overview/fim/dashboard/dashboard';
import { DashboardNIST80053 } from '../../overview/nist/dashboards/dashboard';
import { DashboardHIPAA } from '../../overview/hipaa/dashboards/dashboard';
import { DashboardTSC } from '../../overview/tsc/dashboards/dashboard';
import {
  DockerDataSource,
  AlertsDataSource,
  AlertsVulnerabilitiesDataSource,
  AWSDataSource,
  VirusTotalDataSource,
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
} from '../data-source';

const renderDiscoverTab = (props: WazuhDiscoverProps) => {
  return {
    id: 'events',
    name: 'Events',
    buttons: [ButtonModuleExploreAgent],
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
        buttons: [ButtonModuleExploreAgent, ButtonModuleGenerateReport],
        component: DashboardThreatHunting,
      },
      renderDiscoverTab({
        tableColumns: threatHuntingColumns,
        DataSource: AlertsDataSource,
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
        buttons: [ButtonModuleExploreAgent, ButtonModuleGenerateReport],
        component: DashboardFIM,
      },
      {
        id: 'inventory',
        name: 'Inventory',
        buttons: [ButtonModuleExploreAgent],
        component: MainFim,
      },
      renderDiscoverTab({
        tableColumns: fileIntegrityMonitoringColumns,
        DataSource: FIMDataSource,
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
        buttons: [ButtonModuleExploreAgent, ButtonModuleGenerateReport],
        component: DashboardAWS,
      },
      renderDiscoverTab({
        tableColumns: amazonWebServicesColumns,
        DataSource: AWSDataSource,
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
        buttons: [ButtonModuleExploreAgent, ButtonModuleGenerateReport],
      },
      renderDiscoverTab({
        tableColumns: googleCloudColumns,
        DataSource: GoogleCloudDataSource,
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
        buttons: [ButtonModuleExploreAgent, ButtonModuleGenerateReport],
        component: DashboardMalwareDetection,
      },
      renderDiscoverTab({
        tableColumns: malwareDetectionColumns,
        DataSource: MalwareDetectionDataSource,
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
        buttons: [ButtonModuleExploreAgent],
        component: MainSca,
      },
      {
        id: 'inventory',
        name: 'Inventory',
        buttons: [ButtonModuleExploreAgent],
        component: MainSca,
      },
      renderDiscoverTab({
        tableColumns: configurationAssessmentColumns,
        DataSource: ConfigurationAssessmentDataSource,
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
        buttons: [ButtonModuleExploreAgent, ButtonModuleGenerateReport],
      },
      {
        id: 'inventory',
        name: 'Panel',
        buttons: [ButtonModuleExploreAgent],
        component: OfficePanel,
      },
      renderDiscoverTab({
        tableColumns: office365Columns,
        DataSource: Office365DataSource,
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
        buttons: [ButtonModuleExploreAgent, ButtonModuleGenerateReport],
        component: DashboardGitHub,
      },
      {
        id: 'inventory',
        name: 'Panel',
        buttons: [ButtonModuleExploreAgent],
        component: GitHubPanel,
      },
      renderDiscoverTab({
        tableColumns: githubColumns,
        DataSource: GitHubDataSource,
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
        /* For ButtonModuleExploreAgent to insert correctly according to the module's index pattern, the moduleIndexPatternTitle parameter is added. By default it applies the index patternt wazuh-alerts-* */
        buttons: [
          ({ ...props }) => (
            <ButtonModuleExploreAgent
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
        /* For ButtonModuleExploreAgent to insert correctly according to the module's index pattern, the moduleIndexPatternTitle parameter is added. By default it applies the index patternt wazuh-alerts-* */
        buttons: [
          ({ ...props }) => (
            <ButtonModuleExploreAgent
              {...props}
              moduleIndexPatternTitle={WAZUH_VULNERABILITIES_PATTERN}
            />
          ),
        ],
      },
      renderDiscoverTab({
        tableColumns: vulnerabilitiesColumns,
        DataSource: AlertsVulnerabilitiesDataSource,
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
        buttons: [ButtonModuleExploreAgent, ButtonModuleGenerateReport],
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
        buttons: [ButtonModuleExploreAgent],
        component: MainMitre,
      },
      renderDiscoverTab({
        DataSource: MitreAttackDataSource,
        tableColumns: mitreAttackColumns,
      }),
    ],
    availableFor: ['manager', 'agent'],
  },
  virustotal: {
    tabs: [
      {
        id: 'dashboard',
        name: 'Dashboard',
        buttons: [ButtonModuleExploreAgent, ButtonModuleGenerateReport],
        component: DashboardVirustotal,
      },
      renderDiscoverTab({
        tableColumns: virustotalColumns,
        DataSource: VirusTotalDataSource,
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
        buttons: [ButtonModuleExploreAgent, ButtonModuleGenerateReport],
        component: DashboardDocker,
      },
      renderDiscoverTab({
        tableColumns: dockerColumns,
        DataSource: DockerDataSource,
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
        buttons: [ButtonModuleExploreAgent, ButtonModuleGenerateReport],
        component: DashboardPCIDSS,
      },
      {
        id: 'inventory',
        name: 'Controls',
        buttons: [ButtonModuleExploreAgent],
        component: props => (
          <ComplianceTable {...props} DataSource={PCIDSSDataSource} />
        ),
      },
      renderDiscoverTab({
        tableColumns: pciColumns,
        DataSource: PCIDSSDataSource,
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
        buttons: [ButtonModuleExploreAgent, ButtonModuleGenerateReport],
        component: DashboardHIPAA,
      },
      {
        id: 'inventory',
        name: 'Controls',
        buttons: [ButtonModuleExploreAgent],
        component: props => (
          <ComplianceTable {...props} DataSource={HIPAADataSource} />
        ),
      },
      renderDiscoverTab({
        tableColumns: hipaaColumns,
        DataSource: HIPAADataSource,
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
        buttons: [ButtonModuleExploreAgent, ButtonModuleGenerateReport],
        component: DashboardNIST80053,
      },
      {
        id: 'inventory',
        name: 'Controls',
        buttons: [ButtonModuleExploreAgent],
        component: props => (
          <ComplianceTable {...props} DataSource={NIST80053DataSource} />
        ),
      },
      renderDiscoverTab({
        tableColumns: nistColumns,
        DataSource: NIST80053DataSource,
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
        buttons: [ButtonModuleExploreAgent, ButtonModuleGenerateReport],
        component: DashboardGDPR,
      },
      {
        id: 'inventory',
        name: 'Controls',
        buttons: [ButtonModuleExploreAgent],
        component: props => (
          <ComplianceTable {...props} DataSource={GDPRDataSource} />
        ),
      },
      renderDiscoverTab({
        tableColumns: gdprColumns,
        DataSource: GDPRDataSource,
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
        buttons: [ButtonModuleExploreAgent, ButtonModuleGenerateReport],
        component: DashboardTSC,
      },
      {
        id: 'inventory',
        name: 'Controls',
        buttons: [ButtonModuleExploreAgent],
        component: props => (
          <ComplianceTable {...props} DataSource={TSCDataSource} />
        ),
      },
      renderDiscoverTab({
        tableColumns: tscColumns,
        DataSource: TSCDataSource,
      }),
    ],
    availableFor: ['manager', 'agent'],
  },
  syscollector: {
    notModule: true,
  },
  configuration: {
    notModule: true,
  },
  stats: {
    notModule: true,
  },
};
