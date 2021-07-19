/*
 * Wazuh app - Simple description for each App tabs
 * Copyright (C) 2015-2021 Wazuh, Inc.
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

const DashboardTab = { id: 'dashboard', name: 'Dashboard', buttons: [ButtonModuleExploreAgent, ButtonModuleGenerateReport], component: Dashboard};
const EventsTab = { id: 'events', name: 'Events', buttons: [ButtonModuleExploreAgent], component: Events };
const RegulatoryComplianceTabs = [{ id: 'inventory', name: 'Controls', buttons: [ButtonModuleExploreAgent], component: ComplianceTable }, DashboardTab, EventsTab];

export const ModulesDefaults = {
  general: {
    init: 'dashboard',
    tabs: [DashboardTab, EventsTab]
  },
  fim: {
    init: 'dashboard',
    tabs: [{ id: 'inventory', name: 'Inventory', onlyAgent: false, buttons: [ButtonModuleExploreAgent], component: MainFim }, DashboardTab, EventsTab],
  },
  aws: {
    init: 'dashboard',
    tabs: [DashboardTab, EventsTab]
  },
  gcp: {
    init: 'dashboard',
    tabs: [DashboardTab, EventsTab],
  },
  pm: {
    init: 'dashboard',
    tabs: [DashboardTab, EventsTab],
  },
  audit: {
    init: 'dashboard',
    tabs: [DashboardTab, EventsTab],
  },
  sca: {
    init: 'inventory',
    tabs: [{ id: 'inventory', name: 'Inventory', buttons: [ButtonModuleExploreAgent], component: MainSca }, EventsTab],
    buttons: ['settings']
  },
  ciscat: {
    init: 'dashboard',
    tabs: [DashboardTab, EventsTab],
  },
  vuls: {
    init: 'dashboard',
    tabs: [{ id: 'inventory', name: 'Inventory', onlyAgent: false, buttons: [ButtonModuleExploreAgent], component: MainVuls }, DashboardTab, EventsTab],
    buttons: ['settings']
  },
  mitre: {
    init: 'dashboard',
    tabs: [{ id: 'intelligence', name: 'Intelligence', component: ModuleMitreAttackIntelligence }, { id: 'inventory', name: 'Framework', buttons: [ButtonModuleExploreAgent], component: MainMitre }, DashboardTab, EventsTab]
  },
  virustotal: {
    init: 'dashboard',
    tabs: [DashboardTab, EventsTab]
  },
  pci: {
    init: 'dashboard',
    tabs: RegulatoryComplianceTabs
  },
  osquery: {
    init: 'dashboard',
    tabs: [DashboardTab, EventsTab],
  },
  oscap: {
    init: 'dashboard',
    tabs: [DashboardTab, EventsTab],
  },
  pci: {
    init: 'dashboard',
    tabs: [DashboardTab, EventsTab],
  },
  hipaa: {
    init: 'dashboard',
    tabs: RegulatoryComplianceTabs
  },
  nist: {
    init: 'dashboard',
    tabs: RegulatoryComplianceTabs
  },
  gdpr: {
    init: 'dashboard',
    tabs: RegulatoryComplianceTabs
  },
  tsc: {
    init: 'dashboard',
    tabs: RegulatoryComplianceTabs
  },
  syscollector: {
    notModule: true
  },
  configuration: {
    notModule: true
  },
  stats: {
    notModule: true
  }
};
