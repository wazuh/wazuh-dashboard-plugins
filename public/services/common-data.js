/*
 * Wazuh app - Common data service
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export class CommonData {
  /**
   * Class constructor
   * @param {*} $rootScope
   * @param {*} $timeout
   * @param {*} genericReq
   * @param {*} appState
   * @param {*} errorHandler
   * @param {*} $location
   * @param {*} shareAgent
   * @param {*} globalState
   */
  constructor(
    $rootScope,
    $timeout,
    genericReq,
    appState,
    errorHandler,
    $location,
    shareAgent,
    globalState
  ) {
    this.$rootScope = $rootScope;
    this.$timeout = $timeout;
    this.genericReq = genericReq;
    this.appState = appState;
    this.errorHandler = errorHandler;
    this.$location = $location;
    this.shareAgent = shareAgent;
    this.globalState = globalState;
    this.savedTimefilter = null;
    this.refreshInterval = { pause: true, value: 0 };
  }

  /**
   * Remove rule id
   */
  removeRuleId() {
    if (!this.globalState || !this.globalState.filters) return;
    const arr = [];
    for (const item of this.globalState.filters) {
      if (
        item.query &&
        item.query.match &&
        item.query.match['rule.id'] &&
        item.query.match['rule.id'].query
      ) {
        continue;
      }
      arr.push(item);
    }
    this.globalState.filters = arr;
  }

  /**
   * Remove duplicate rule for a given group
   * @param {String} group
   */
  removeDuplicateRuleGroups(group) {
    if (!this.globalState || !this.globalState.filters) return;
    const globalRuleGroupFilters = this.globalState.filters.map(item => {
      if (
        item.query &&
        item.query.match &&
        item.query.match['rule.groups'] &&
        item.query.match['rule.groups'].query
      ) {
        return item.query.match['rule.groups'].query;
      }

      return null;
    });

    if (globalRuleGroupFilters.includes(group)) {
      this.globalState.filters.splice(globalRuleGroupFilters.indexOf(group), 1);
    }
  }

  /**
   * Remove duplicates if exists
   * @param {String} condition
   */
  removeDuplicateExists(condition) {
    if (!this.globalState || !this.globalState.filters) return;
    const globalRuleExistsFilters = this.globalState.filters.map(item => {
      if (item.exists && item.exists.field) {
        return item.exists.field;
      }

      return null;
    });

    if (globalRuleExistsFilters.includes(condition)) {
      this.globalState.filters.splice(
        globalRuleExistsFilters.indexOf(condition),
        1
      );
    }
  }

  /**
   * After filter manage
   * @param {*} filterHandler
   * @param {*} tab
   * @param {*} localChange
   * @param {*} agent
   */
  af(filterHandler, tab, localChange, agent) {
    try {
      const tabFilters = {
        general: { group: '' },
        fim: { group: 'syscheck' },
        pm: { group: 'rootcheck' },
        vuls: { group: 'vulnerability-detector' },
        oscap: { group: 'oscap' },
        ciscat: { group: 'ciscat' },
        audit: { group: 'audit' },
        pci: { group: 'pci_dss' },
        gdpr: { group: 'gdpr' },
        hipaa: { group: 'hipaa' },
        nist: { group: 'nist' },
        aws: { group: 'amazon' },
        virustotal: { group: 'virustotal' },
        osquery: { group: 'osquery' },
        sca: { group: 'sca' },
        docker: { group: 'docker' }
      };

      const filters = [];
      const isCluster = this.appState.getClusterInfo().status == 'enabled';
      filters.push(
        filterHandler.managerQuery(
          isCluster
            ? this.appState.getClusterInfo().cluster
            : this.appState.getClusterInfo().manager,
          isCluster
        )
      );

      if (tab !== 'general') {
        if (tab === 'pci') {
          this.removeDuplicateExists('rule.pci_dss');
          filters.push(filterHandler.pciQuery());
        } else if (tab === 'gdpr') {
          this.removeDuplicateExists('rule.gdpr');
          filters.push(filterHandler.gdprQuery());
        } else if (tab === 'hipaa') {
          this.removeDuplicateExists('rule.hipaa');
          filters.push(filterHandler.hipaaQuery());
        } else if (tab === 'nist') {
          this.removeDuplicateExists('rule.nist_800_53');
          filters.push(filterHandler.nistQuery());
        } else {
          this.removeDuplicateRuleGroups(tabFilters[tab].group);
          filters.push(filterHandler.ruleGroupQuery(tabFilters[tab].group));
        }
      }
      if (agent) filters.push(filterHandler.agentQuery(agent));
      this.$rootScope.$emit('wzEventFilters', { filters, localChange });
      if (!this.$rootScope.$$listenerCount['wzEventFilters']) {
        this.$timeout(100).then(() =>
          this.af(filterHandler, tab, localChange, (agent = false))
        );
      }
    } catch (error) {
      this.errorHandler.handle(
        'An error occurred while creating custom filters for visualizations',
        agent ? 'Agents' : 'Overview',
        true
      );
    }
  }

  /**
   * Get GDPR
   */
  async getGDPR() {
    try {
      const gdprTabs = [];
      const data = await this.genericReq.request('GET', '/api/gdpr/all');
      if (!data.data) return [];
      for (const key in data.data) {
        gdprTabs.push({ title: key, content: data.data[key] });
      }
      return gdprTabs;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * GET PCI
   */
  async getPCI() {
    try {
      const pciTabs = [];
      const data = await this.genericReq.request('GET', '/api/pci/all');
      if (!data.data) return [];
      for (const key in data.data) {
        pciTabs.push({ title: key, content: data.data[key] });
      }
      return pciTabs;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
 * GET HIPAA
 */
  async getHIPAA() {
    try {
      const hipaaTabs = [];
      const data = await this.genericReq.request('GET', '/api/hipaa/all');
      if (!data.data) return [];
      for (const key in data.data) {
        hipaaTabs.push({ title: key, content: data.data[key] });
      }
      return hipaaTabs;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
 * GET NIST 800-53
 */
  async getNIST() {
    try {
      const nistTabs = [];
      const data = await this.genericReq.request('GET', '/api/nist/all');
      if (!data.data) return [];
      for (const key in data.data) {
        nistTabs.push({ title: key, content: data.data[key] });
      }
      return nistTabs;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Assign given filter
   * @param {Object} filterHandler
   * @param {Object} tab
   * @param {Object} localChange
   * @param {Object} agent
   */
  assignFilters(filterHandler, tab, localChange, agent) {
    return this.af(filterHandler, tab, localChange, agent);
  }

  /**
   * Validate range of given data
   * @param {Object} data
   */
  validateRange(data) {
    const result = {
      duration: '-',
      inProgress: false,
      end: data.end || false,
      start: data.start || false
    };

    if (result.end && result.start) {
      result.duration =
        (new Date(result.end) - new Date(result.start)) / 1000 / 60;
      result.duration = Math.round(result.duration * 100) / 100;
      if (result.duration <= 0) {
        result.inProgress = true;
      }
    }

    if (result.start === 'ND' || !result.start) result.start = '-';
    if (result.end === 'ND' || !result.end) result.end = '-';

    return result;
  }

  /**
   * Check the tab location
   */
  checkTabLocation() {
    if (this.$location.search().tab) {
      return this.$location.search().tab;
    } else {
      this.$location.search('tab', 'welcome');
      return 'welcome';
    }
  }

  /**
   * Check the tab view location
   */
  checkTabViewLocation() {
    if (this.$location.search().tabView) {
      return this.$location.search().tabView;
    } else {
      this.$location.search('tabView', 'panels');
      return 'panels';
    }
  }

  /**
   * Check the location of a given agent
   * @param {String} newAgentId
   * @param {Boolean} globalAgent
   */
  checkLocationAgentId(newAgentId, globalAgent) {
    if (newAgentId) {
      this.$location.search('agent', newAgentId);
      return newAgentId;
    } else {
      if (this.$location.search().agent && !globalAgent) {
        // There's one in the url
        return this.$location.search().agent;
      } else {
        this.shareAgent.deleteAgent();
        this.$location.search('agent', globalAgent.id);
        return globalAgent.id;
      }
    }
  }

  setTimefilter(time) {
    if (time) this.savedTimefilter = time;
  }

  removeTimefilter() {
    this.savedTimefilter = null;
  }

  getTimefilter() {
    return this.savedTimefilter;
  }

  setRefreshInterval(interval) {
    if (interval) Object.assign(this.refreshInterval, interval);
  }

  getRefreshInterval() {
    return this.refreshInterval;
  }
}
