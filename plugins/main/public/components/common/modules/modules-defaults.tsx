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
import { MainMitre } from './main-mitre';
import { MainFim } from '../../agents/fim';
import { ModuleMitreAttackIntelligence } from '../../overview/mitre_attack_intelligence';
import { ComplianceTable } from '../../overview/compliance-table';
import ButtonModuleExploreAgent from '../../../controllers/overview/components/overview-actions/overview-actions';
import { ButtonModuleGenerateReport } from '../modules/buttons';
import { OfficePanel } from '../../overview/office-panel';
import { GitHubPanel } from '../../overview/github-panel';
import { DashboardVuls, InventoryVuls } from '../../overview/vulnerabilities';
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
import {
  AlertsFIMDataSource,
  AlertsVulnerabilitiesDataSource,
} from '../data-source';
import { DashboardFIM } from '../../overview/fim/dashboard/dashboard';

const ALERTS_INDEX_PATTERN = 'wazuh-alerts-*';
const DEFAULT_INDEX_PATTERN = ALERTS_INDEX_PATTERN;

const DashboardTab = {
  id: 'dashboard',
  name: 'Dashboard',
  buttons: [ButtonModuleExploreAgent, ButtonModuleGenerateReport],
  component: Dashboard,
};

const renderDiscoverTab = (props: WazuhDiscoverProps) => {
  const { DataSource, tableColumns } = props;
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
      DashboardTab,
      renderDiscoverTab(DEFAULT_INDEX_PATTERN, threatHuntingColumns),
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
      DashboardTab,
      renderDiscoverTab(DEFAULT_INDEX_PATTERN, amazonWebServicesColumns),
    ],
    availableFor: ['manager', 'agent'],
  },
  gcp: {
    init: 'dashboard',
    tabs: [
      DashboardTab,
      renderDiscoverTab(DEFAULT_INDEX_PATTERN, googleCloudColumns),
    ],
    availableFor: ['manager', 'agent'],
  },
  // This module is Malware Detection. Ref: https://github.com/wazuh/wazuh-dashboard-plugins/issues/5893
  pm: {
    init: 'dashboard',
    tabs: [
      DashboardTab,
      renderDiscoverTab(DEFAULT_INDEX_PATTERN, malwareDetectionColumns),
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
      DashboardTab,
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
      renderDiscoverTab(DEFAULT_INDEX_PATTERN, mitreAttackColumns),
    ],
    availableFor: ['manager', 'agent'],
  },
  virustotal: {
    init: 'dashboard',
    tabs: [
      DashboardTab,
      renderDiscoverTab(DEFAULT_INDEX_PATTERN, virustotalColumns),
    ],
    availableFor: ['manager', 'agent'],
  },
  docker: {
    init: 'dashboard',
    tabs: [
      DashboardTab,
      renderDiscoverTab(DEFAULT_INDEX_PATTERN, dockerColumns),
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
