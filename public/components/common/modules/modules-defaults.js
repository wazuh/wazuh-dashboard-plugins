/*
 * Wazuh app - Simple description for each App tabs
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export const ModulesDefaults = {
  general: {
    init: 'dashboard',
    tabs: [{ id: 'dashboard', name: 'Dashboard' }, { id: 'events', name: 'Events' }],
    buttons: ['reporting']
  },
  fim: {
    init: 'dashboard',
    tabs: [{ id: 'inventory', name: 'Inventory', onlyAgent: false }, { id: 'dashboard', name: 'Dashboard' }, { id: 'events', name: 'Events' }],
    buttons: ['reporting', 'settings']
  },
  gcp: {
    init: 'dashboard',
    tabs: [{ id: 'dashboard', name: 'Dashboard' }, { id: 'events', name: 'Events' }],
    buttons: ['reporting']
  },
  sca: {
    init: 'inventory',
    tabs: [{ id: 'inventory', name: 'Inventory' }, { id: 'events', name: 'Events' }],
    buttons: ['settings']
  },
  mitre: {
    init: 'dashboard',
    tabs: [{ id: 'inventory', name: 'Framework' }, { id: 'dashboard', name: 'Dashboard' }, { id: 'events', name: 'Events' }],
    buttons: ['reporting']
  },
  virustotal: {
    init: 'dashboard',
    tabs: [{ id: 'dashboard', name: 'Dashboard' }, { id: 'events', name: 'Events' }],
    buttons: ['reporting']
  },
  pci: {
    init: 'dashboard',
    tabs: [{ id: 'inventory', name: 'Controls' }, { id: 'dashboard', name: 'Dashboard' }, { id: 'events', name: 'Events' }],
    buttons: ['reporting']
  },
  hipaa: {
    init: 'dashboard',
    tabs: [{ id: 'inventory', name: 'Controls' }, { id: 'dashboard', name: 'Dashboard' }, { id: 'events', name: 'Events' }],
    buttons: ['reporting']
  },
  nist: {
    init: 'dashboard',
    tabs: [{ id: 'inventory', name: 'Controls' }, { id: 'dashboard', name: 'Dashboard' }, { id: 'events', name: 'Events' }],
    buttons: ['reporting']
  },
  gdpr: {
    init: 'dashboard',
    tabs: [{ id: 'inventory', name: 'Controls' }, { id: 'dashboard', name: 'Dashboard' }, { id: 'events', name: 'Events' }],
    buttons: ['reporting']
  },
  tsc: {
    init: 'dashboard',
    tabs: [{ id: 'inventory', name: 'Controls' }, { id: 'dashboard', name: 'Dashboard' }, { id: 'events', name: 'Events' }],
    buttons: ['reporting']
  },
  syscollector: {
    notModule: true
  },
  configuration: {
    notModule: true
  }
};
