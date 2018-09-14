/*
 * Wazuh app - Factory to store visualization tabs
 *
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export class TabVisualizations {
  constructor() {
    this.agents = {
      welcome: 0,
      general: 7,
      fim: 7,
      pm: 4,
      vuls: 7,
      oscap: 13,
      ciscat: 11,
      audit: 15,
      gdpr: 3,
      pci: 3,
      virustotal: 6,
      configuration: 0
    };

    this.overview = {
      welcome: 0,
      general: 11,
      fim: 10,
      pm: 5,
      vuls: 8,
      oscap: 11,
      ciscat: 11,
      audit: 15,
      pci: 6,
      gdpr: 6,
      aws: 10,
      virustotal: 7
    };

    this.tabVisualizations = {};
    this.currentTab = '';
  }

  setTab(tab) {
    this.currentTab = tab;
  }

  getTab() {
    return this.currentTab;
  }

  getItem(item) {
    return this.tabVisualizations[item];
  }

  assign(tabs) {
    if (typeof tabs === 'object') {
      this.tabVisualizations = tabs;
    } else if (typeof tabs === 'string') {
      this.tabVisualizations =
        tabs === 'overview' ? this.overview : this.agents;
    }
  }

  removeAll() {
    this.tabVisualizations = {};
  }
}
