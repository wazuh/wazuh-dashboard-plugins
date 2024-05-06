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
import { OfficePanel } from '../../overview/office-panel';
import { GitHubPanel } from '../../overview/github-panel';
import { DashboardVuls, InventoryVuls } from '../../overview/vulnerabilities';
import { DashboardMITRE } from '../../overview/mitre/dashboard';
import { withModuleNotForAgent } from '../hocs';
import {
  WazuhDiscover,
  WazuhDiscoverProps,
} from '../wazuh-discover/wz-discover';
import { threatHuntingColumns } from '../wazuh-discover/config/data-grid-columns';
import { vulnerabilitiesColumns } from '../../overview/vulnerabilities/events/vulnerabilities-columns';
import { DashboardThreatHunting } from '../../overview/threat-hunting/dashboard/dashboard';
import { DashboardVirustotal } from '../../overview/virustotal/dashboard/dashboard';
import { DashboardGoogleCloud } from '../../overview/google-cloud/dashboards';
import React from 'react';
import { dockerColumns } from '../../overview/docker/events/docker-columns';
import { googleCloudColumns } from '../../overview/google-cloud/events/google-cloud-columns';
import { amazonWebServicesColumns } from '../../overview/amazon-web-services/events/amazon-web-services-columns';
import { office365Columns } from '../../overview/office-panel/events/office-365-columns';
import { fileIntegrityMonitoringColumns } from '../../overview/fim/events/file-integrity-monitoring-columns';
import { configurationAssessmentColumns } from '../../agents/sca/events/configuration-assessment-columns';
import { pciColumns } from '../../overview/pci/events/pci-columns';
import { hipaaColumns } from '../../overview/hipaa/events/hipaa-columns';
import { nistColumns } from '../../overview/nist/events/nist-columns';
import { gdprColumns } from '../../overview/gdpr/events/gdpr-columns';
import { tscColumns } from '../../overview/tsc/events/tsc-columns';
import { githubColumns } from '../../overview/github-panel/events/github-columns';
import { mitreAttackColumns } from '../../overview/mitre/events/mitre-attack-columns';
import { virustotalColumns } from '../../overview/virustotal/events/virustotal-columns';
import { malwareDetectionColumns } from '../../overview/malware-detection/events/malware-detection-columns';
import { WAZUH_VULNERABILITIES_PATTERN } from '../../../../common/constants';
import { DashboardDocker } from '../../overview/docker/dashboards';
import { DashboardMalwareDetection } from '../../overview/malware-detection/dashboard';
import { DashboardFIM } from '../../overview/fim/dashboard/dashboard';
import { MitreAttackDataSource } from '../data-source/pattern/alerts/mitre-attack/mitre-attack-data-source';
import {
  AlertsDockerDataSource,
  AlertsDataSource,
  AlertsVulnerabilitiesDataSource,
  AlertsAWSDataSource,
  VirusTotalDataSource,
  AlertsGoogleCloudDataSource,
  AlertsMalwareDetectionDataSource,
  AlertsFIMDataSource,
} from '../data-source';

const ALERTS_INDEX_PATTERN = 'wazuh-alerts-*';
const DEFAULT_INDEX_PATTERN = ALERTS_INDEX_PATTERN;

const DashboardTab = {
  id: 'dashboard',
  name: 'Dashboard',
  buttons: [ButtonModuleExploreAgent, ButtonModuleGenerateReport],
  component: Dashboard,
};

const renderDiscoverTab = (props: WazuhDiscoverProps) => {
  return {
    id: 'events',
    name: 'Events',
    buttons: [ButtonModuleExploreAgent],
    component: () => <WazuhDiscover {...props} />,
  };
};

const RegulatoryComplianceTabs = columns => [
  DashboardTab,
  {
    id: 'inventory',
    name: 'Controls',
    buttons: [ButtonModuleExploreAgent],
    component: ComplianceTable,
  },
  renderDiscoverTab(DEFAULT_INDEX_PATTERN, columns),
];

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
        DataSource: AlertsFIMDataSource,
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
        DataSource: AlertsAWSDataSource,
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
        DataSource: AlertsGoogleCloudDataSource,
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
        DataSource: AlertsMalwareDetectionDataSource,
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
      renderDiscoverTab(DEFAULT_INDEX_PATTERN, configurationAssessmentColumns),
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
        buttons: [ButtonModuleExploreAgent, ButtonModuleGenerateReport],
        component: withModuleNotForAgent(Dashboard),
      },
      {
        id: 'inventory',
        name: 'Panel',
        buttons: [ButtonModuleExploreAgent],
        component: withModuleNotForAgent(OfficePanel),
      },
      {
        ...renderDiscoverTab(DEFAULT_INDEX_PATTERN, office365Columns),
        component: withModuleNotForAgent(() => (
          <WazuhDiscover tableColumns={office365Columns} />
        )),
      },
    ],
    availableFor: ['manager'],
  },
  github: {
    init: 'dashboard',
    tabs: [
      DashboardTab,
      {
        id: 'inventory',
        name: 'Panel',
        buttons: [ButtonModuleExploreAgent],
        component: GitHubPanel,
      },
      renderDiscoverTab(DEFAULT_INDEX_PATTERN, githubColumns),
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
        DataSource: AlertsDockerDataSource,
      }),
    ],
    availableFor: ['manager', 'agent'],
  },
  pci: {
    init: 'dashboard',
    tabs: RegulatoryComplianceTabs(pciColumns),
    availableFor: ['manager', 'agent'],
  },
  hipaa: {
    init: 'dashboard',
    tabs: RegulatoryComplianceTabs(hipaaColumns),
    availableFor: ['manager', 'agent'],
  },
  nist: {
    init: 'dashboard',
    tabs: RegulatoryComplianceTabs(nistColumns),
    availableFor: ['manager', 'agent'],
  },
  gdpr: {
    init: 'dashboard',
    tabs: RegulatoryComplianceTabs(gdprColumns),
    availableFor: ['manager', 'agent'],
  },
  tsc: {
    init: 'dashboard',
    tabs: RegulatoryComplianceTabs(tscColumns),
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
