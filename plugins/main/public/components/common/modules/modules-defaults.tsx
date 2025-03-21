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
import { MainFim } from '../../agents/fim';
import { ComplianceTable } from '../../overview/compliance-table';
import { ButtonModuleGenerateReport } from '../modules/buttons';
import { OfficePanel } from '../../overview/office/panel';
import { GitHubPanel } from '../../overview/github/panel';
import { withModuleNotForAgent } from '../hocs';
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
import { WAZUH_VULNERABILITIES_PATTERN } from '../../../../common/constants';
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
} from '../data-source';
import { ButtonExploreAgent } from '../../wz-agent-selector/button-explore-agent';
import { SystemInventoryProcessesTable } from '../../overview/system-inventory-processes/inventory/inventory';
import { SystemInventoryPackagesTable } from '../../overview/system-inventory-packages/inventory/inventory';
import { SystemInventoryNetworksTable } from '../../overview/system-inventory-networks/inventory/inventory';
import { SystemInventoryHotfixesTable } from '../../overview/system-inventory-hotfixes/inventory/inventory';
import { SystemInventoryPortsTable } from '../../overview/system-inventory-ports/inventory/inventory';
import { SystemInventoryInterfacesTable } from '../../overview/system-inventory-interfaces/inventory/inventory';
import { SystemInventoryProtocolsTable } from '../../overview/system-inventory-protocols/inventory/inventory';
import { SystemInventorySystemTable } from '../../overview/system-inventory-system/inventory/inventory';
import { SystemInventoryHardwareTable } from '../../overview/system-inventory-hardware/inventory/inventory';
import { InventoryFIMFiles } from '../../overview/fim/inventory-files';
import { InventoryFIMRegistries } from '../../overview/fim/inventory-registries';

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
        tableColumns: threatHuntingColumns,
        DataSource: ThreatHuntingDataSource,
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
        id: 'inventory-files',
        name: 'Inventory - Files',
        buttons: [ButtonExploreAgent],
        component: InventoryFIMFiles,
      },
      {
        id: 'inventory-registries',
        name: 'Inventory - Registries',
        buttons: [ButtonExploreAgent],
        component: InventoryFIMRegistries,
      },
      {
        id: 'inventory-og',
        name: 'InventoryOG',
        buttons: [ButtonExploreAgent],
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
        buttons: [ButtonExploreAgent, ButtonModuleGenerateReport],
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
        buttons: [ButtonExploreAgent, ButtonModuleGenerateReport],
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
        buttons: [ButtonExploreAgent, ButtonModuleGenerateReport],
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
        buttons: [ButtonExploreAgent, ButtonModuleGenerateReport],
      },
      {
        id: 'inventory',
        name: 'Panel',
        buttons: [ButtonExploreAgent],
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
        DataSource: MitreAttackDataSource,
        tableColumns: mitreAttackColumns,
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
        tableColumns: tscColumns,
        DataSource: TSCDataSource,
      }),
    ],
    availableFor: ['manager', 'agent'],
  },
  'system-inventory-hosts': {
    init: 'hardware',
    tabs: [
      {
        id: 'hardware',
        name: 'Hardware',
        buttons: [ButtonExploreAgent],
        component: SystemInventoryHardwareTable,
      },
      {
        id: 'software',
        name: 'Software',
        buttons: [ButtonExploreAgent],
        component: SystemInventorySystemTable,
      },
    ],
    availableFor: ['manager', 'agent'],
  },
  'system-inventory-network': {
    init: 'interfaces',
    tabs: [
      {
        id: 'interfaces',
        name: 'Interfaces',
        buttons: [ButtonExploreAgent],
        component: SystemInventoryInterfacesTable,
      },
      {
        id: 'ports',
        name: 'Ports',
        buttons: [ButtonExploreAgent],
        component: SystemInventoryPortsTable,
      },
      {
        id: 'protocols',
        name: 'Protocols',
        buttons: [ButtonExploreAgent],
        component: SystemInventoryProtocolsTable,
      },
      {
        id: 'settings',
        name: 'Settings',
        buttons: [ButtonExploreAgent],
        component: SystemInventoryNetworksTable,
      },
    ],
    availableFor: ['manager', 'agent'],
  },
  'system-inventory-software': {
    init: 'packages',
    tabs: [
      {
        id: 'packages',
        name: 'Packages',
        buttons: [ButtonExploreAgent],
        component: SystemInventoryPackagesTable,
      },
      {
        id: 'hotfixes',
        name: 'Hotfixes',
        buttons: [ButtonExploreAgent],
        component: SystemInventoryHotfixesTable,
      },
    ],
    availableFor: ['manager', 'agent'],
  },
  'system-inventory-processes': {
    init: 'proccesses',
    tabs: [
      {
        id: 'proccesses',
        name: 'Proccesses',
        buttons: [ButtonExploreAgent],
        component: SystemInventoryProcessesTable,
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
