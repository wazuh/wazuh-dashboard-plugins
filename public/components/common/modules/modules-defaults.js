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
import { Events } from './events';
import { MainFim } from '../../agents/fim';
import { MainSca } from '../../agents/sca';
import { MainVuls } from '../../agents/vuls';
import { MainMitre } from './main-mitre';
import { ModuleMitreAttackIntelligence } from '../../overview/mitre_attack_intelligence';
import { ComplianceTable } from '../../overview/compliance-table';
import ButtonModuleExploreAgent from '../../../controllers/overview/components/overview-actions/overview-actions';
import { ButtonModuleGenerateReport } from '../modules/buttons';
import { OfficePanel } from '../../overview/office-panel';
import { GitHubPanel } from '../../overview/github-panel';
import { withModuleNotForAgent } from '../hocs';

const DashboardTab = {
  id: 'dashboard',
  name: 'Dashboard',
  buttons: [ButtonModuleExploreAgent, ButtonModuleGenerateReport],
  component: Dashboard,
};
const EventsTab = {
  id: 'events',
  name: 'Events',
  buttons: [ButtonModuleExploreAgent],
  component: Events,
};
const RegulatoryComplianceTabs = [
  {
    id: 'inventory',
    name: 'Controls',
    buttons: [ButtonModuleExploreAgent],
    component: ComplianceTable,
  },
  DashboardTab,
  EventsTab,
];

export const ModulesDefaults = {
  general: {
    init: 'dashboard',
    tabs: [DashboardTab, EventsTab],
    availableFor: ['manager', 'agent'],
  },
  fim: {
    init: 'dashboard',
    tabs: [
      {
        id: 'inventory',
        name: 'Inventory',
        buttons: [ButtonModuleExploreAgent],
        component: MainFim,
      },
      DashboardTab,
      EventsTab,
    ],
    availableFor: ['manager', 'agent'],
  },
  aws: {
    init: 'dashboard',
    tabs: [DashboardTab, EventsTab],
    availableFor: ['manager', 'agent'],
  },
  gcp: {
    init: 'dashboard',
    tabs: [DashboardTab, EventsTab],
    availableFor: ['manager', 'agent'],
  },
  pm: {
    init: 'dashboard',
    tabs: [DashboardTab, EventsTab],
    availableFor: ['manager', 'agent'],
  },
  audit: {
    init: 'dashboard',
    tabs: [DashboardTab, EventsTab],
    availableFor: ['manager', 'agent'],
  },
  sca: {
    init: 'inventory',
    tabs: [
      {
        id: 'inventory',
        name: 'Inventory',
        buttons: [ButtonModuleExploreAgent],
        component: MainSca,
      },
      EventsTab,
    ],
    buttons: ['settings'],
    availableFor: ['manager', 'agent'],
  },
  office: {
    init: 'dashboard',
    tabs: [
      {
        id: 'inventory',
        name: 'Panel',
        buttons: [ButtonModuleExploreAgent],
        component: withModuleNotForAgent(OfficePanel),
      },
      {
        id: 'dashboard',
        name: 'Dashboard',
        buttons: [ButtonModuleExploreAgent, ButtonModuleGenerateReport],
        component: withModuleNotForAgent(Dashboard),
      },
      { ...EventsTab, component: withModuleNotForAgent(Events) },
    ],
    availableFor: ['manager'],
  },
  github: {
    init: 'dashboard',
    tabs: [{ id: 'inventory', name: 'Panel', buttons: [ButtonModuleExploreAgent],  component: GitHubPanel }, DashboardTab, EventsTab],
    availableFor: ['manager', 'agent']
  },
  ciscat: {
    init: 'dashboard',
    tabs: [DashboardTab, EventsTab],
    availableFor: ['manager', 'agent'],
  },
  vuls: {
    init: 'inventory',
    tabs: [
      {
        id: 'inventory',
        name: 'Inventory',
        buttons: [ButtonModuleExploreAgent],
        component: MainVuls,
      },
      EventsTab,
    ],
    buttons: ['settings'],
    availableFor: ['manager', 'agent'],
  },
  mitre: {
    init: 'dashboard',
    tabs: [
      { id: 'intelligence', name: 'Intelligence', component: ModuleMitreAttackIntelligence },
      {
        id: 'inventory',
        name: 'Framework',
        buttons: [ButtonModuleExploreAgent],
        component: MainMitre,
      },
      DashboardTab,
      EventsTab,
    ],
    availableFor: ['manager', 'agent'],
  },
  virustotal: {
    init: 'dashboard',
    tabs: [DashboardTab, EventsTab],
    availableFor: ['manager', 'agent'],
  },
  docker: {
    init: 'dashboard',
    tabs: [DashboardTab, EventsTab],
    availableFor: ['manager', 'agent'],
  },

  osquery: {
    init: 'dashboard',
    tabs: [DashboardTab, EventsTab],
    availableFor: ['manager', 'agent'],
  },
  oscap: {
    init: 'dashboard',
    tabs: [DashboardTab, EventsTab],
    availableFor: ['manager', 'agent'],
  },
  pci: {
    init: 'dashboard',
    tabs: RegulatoryComplianceTabs,
    availableFor: ['manager', 'agent'],
  },
  hipaa: {
    init: 'dashboard',
    tabs: RegulatoryComplianceTabs,
    availableFor: ['manager', 'agent'],
  },
  nist: {
    init: 'dashboard',
    tabs: RegulatoryComplianceTabs,
    availableFor: ['manager', 'agent'],
  },
  gdpr: {
    init: 'dashboard',
    tabs: RegulatoryComplianceTabs,
    availableFor: ['manager', 'agent'],
  },
  tsc: {
    init: 'dashboard',
    tabs: RegulatoryComplianceTabs,
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
