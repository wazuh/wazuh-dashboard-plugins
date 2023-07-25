/*
 * Wazuh app - Factory to store visualization tabs
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export class TabVisualizations {
  /**
   * Class constructor
   */
  constructor() {
    if (!!TabVisualizations.instance) {
      return TabVisualizations.instance;
    }

    this.agents = {
      welcome: 8,
      general: 11,
      fim: 7,
      gcp: 7,
      pm: 4,
      vuls: 10,
      oscap: 13,
      ciscat: 3,
      audit: 9,
      gdpr: 6,
      pci: 6,
      hipaa: 6,
      aws: 8,
      tsc: 6,
      nist: 5,
      virustotal: 6,
      configuration: 0,
      osquery: 5,
      docker: 5,
      mitre: 6
    };

    this.overview = {
      welcome: 0,
      general: 6,
      fim: 7,
      pm: 5,
      vuls: 7,
      oscap: 8,
      ciscat: 3,
      audit: 6,
      pci: 6,
      gdpr: 5,
      hipaa: 8,
      nist: 7,
      aws: 8,
      gcp: 5,
      virustotal: 5,
      osquery: 6,
      sca: 0,
      docker: 5,
      mitre: 6,
      tsc: 6
    };

    this.tabVisualizations = {};
    this.currentTab = '';

    this.deadVisualizations = 0;

    TabVisualizations.instance = this;
    return this;
  }

  /**
   * Set given tab as current
   * @param {Object} tab
   */
  setTab(tab) {
    this.deadVisualizations = 0;
    this.currentTab = tab;
  }

  /**
   * Get current tab
   */
  getTab() {
    return this.currentTab;
  }

  /**
   * Get given item
   * @param {String} item
   */
  getItem(item) {
    return this.tabVisualizations[item];
  }

  /**
   * Assign tab visualization with given tabs
   * @param {Object} tabs
   */
  assign(tabs) {
    if (typeof tabs === 'object') {
      this.tabVisualizations = tabs;
    } else if (typeof tabs === 'string') {
      this.tabVisualizations =
        tabs === 'overview' ? this.overview : this.agents;
    }
  }

  /**
   * Remove all tab Visualizations
   */
  removeAll() {
    this.tabVisualizations = {};
  }

  addDeadVis() {
    this.deadVisualizations += 1;
  }

  getDeadVis() {
    return this.deadVisualizations;
  }

  clearDeadVis() {
    this.deadVisualizations = 0;
  }
}
