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
    tabs: [{ id: 'events', name: 'Events' }],
    buttons: ['dashboard', 'reporting']
  },
  fim: {
    init: 'inventory',
    tabs: [{ id: 'inventory', name: 'Inventory' }, { id: 'events', name: 'Events' }],
    buttons: ['dashboard', 'reporting', 'settings']
  },
  sca: {
    init: 'inventory',
    tabs: [{ id: 'inventory', name: 'Inventory' }, { id: 'events', name: 'Events' }],
    buttons: ['dashboard', 'settings']
  },
  mitre: {
    init: 'dashboard',
    tabs: [{ id: 'events', name: 'Events' }],
    buttons: ['dashboard', 'reporting']
  },
  virustotal: {
    init: 'dashboard',
    tabs: [{ id: 'events', name: 'Events' }],
    buttons: ['dashboard', 'reporting']
  },
  pci: {
    init: 'dashboard',
    tabs: [{ id: 'events', name: 'Events' }],
    buttons: ['dashboard', 'reporting']
  },
  hipaa: {
    init: 'dashboard',
    tabs: [{ id: 'events', name: 'Events' }],
    buttons: ['dashboard', 'reporting']
  },
  nist: {
    init: 'dashboard',
    tabs: [{ id: 'events', name: 'Events' }],
    buttons: ['dashboard', 'reporting']
  },
  gdpr: {
    init: 'dashboard',
    tabs: [{ id: 'events', name: 'Events' }],
    buttons: ['dashboard', 'reporting']
  },
  syscollector: {
    notModule: true
  },
  configuration: {
    notModule: true
  }
};
