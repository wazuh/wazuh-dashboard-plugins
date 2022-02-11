/*
 * Wazuh app - Common data service
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { AppState } from '../react-services/app-state';
import { GenericRequest } from '../react-services/generic-request';
import { ShareAgent } from '../factories/share-agent';
import { ModulesHelper } from '../components/common/modules/modules-helper';
import rison from 'rison-node';

export class CommonData {
  /**
   * Class constructor
   * @param {*} $rootScope
   * @param {*} $timeout
   * @param {*} errorHandler
   * @param {*} $location
   * @param {*} globalState
   */
  constructor($rootScope, $timeout, errorHandler, $location, $window, $route) {
    this.$rootScope = $rootScope;
    this.$timeout = $timeout;
    this.genericReq = GenericRequest;
    this.errorHandler = errorHandler;
    this.$location = $location;
    this.shareAgent = new ShareAgent();
    //    this.globalState = globalState;
    this.savedTimefilter = null;
    this.$window = $window;
    this.$route = $route;
    this.refreshInterval = { pause: true, value: 0 };
    this.overviewTabs = {
      hostMonitoringTabs: ['general', 'fim', 'aws', 'gcp'],
      systemAuditTabs: ['pm', 'audit', 'oscap', 'ciscat'],
      securityTabs: ['vuls', 'virustotal', 'osquery', 'docker', 'mitre'],
      complianceTabs: ['pci', 'gdpr', 'hipaa', 'nist', 'tsc'],
    };

    this.agentTabs = {
      hostMonitoringTabs: ['general', 'fim', 'syscollector'],
      systemAuditTabs: ['pm', 'audit', 'oscap', 'ciscat', 'sca'],
      securityTabs: ['vuls', 'virustotal', 'osquery', 'docker', 'mitre'],
      complianceTabs: ['pci', 'gdpr', 'hipaa', 'nist', 'tsc'],
    };
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
    const globalRuleGroupFilters = this.globalState.filters.map((item) => {
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
    const globalRuleExistsFilters = this.globalState.filters.map((item) => {
      if (item.exists && item.exists.field) {
        return item.exists.field;
      }

      return null;
    });

    if (globalRuleExistsFilters.includes(condition)) {
      this.globalState.filters.splice(globalRuleExistsFilters.indexOf(condition), 1);
    }
  }

  /**
   * After filter manage
   * @param {*} filterHandler
   * @param {*} tab
   * @param {*} localChange
   * @param {*} agent
   */
  async af(filterHandler, tab, agent = false) {
    try {
      const tabFilters = {
        general: { group: '' },
        welcome: { group: '' },
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
        tsc: { group: 'tsc' },
        aws: { group: 'amazon' },
        gcp: { group: 'gcp' },
        office: { group: 'office365' },
        virustotal: { group: 'virustotal' },
        osquery: { group: 'osquery' },
        sca: { group: 'sca' },
        docker: { group: 'docker' },
        github: { group: 'github' }
      };

      const filters = [];
      const isCluster = AppState.getClusterInfo().status == 'enabled';
      filters.push(
        filterHandler.managerQuery(
          isCluster ? AppState.getClusterInfo().cluster : AppState.getClusterInfo().manager,
          isCluster
        )
      );
      if (tab !== 'general' && tab !== 'welcome') {
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
        } else if (tab === 'tsc') {
          this.removeDuplicateExists('rule.tsc');
          filters.push(filterHandler.tscQuery());
        } else if (tab === 'mitre') {
          this.removeDuplicateExists('rule.mitre.id');
          filters.push(filterHandler.mitreQuery());
        } else {
          this.removeDuplicateRuleGroups(tabFilters[tab].group);
          filters.push(filterHandler.ruleGroupQuery(tabFilters[tab].group));
        }
      }

      const regex = new RegExp('addRuleFilter=' + '[^&]*');
      const match = this.$window.location.href.match(regex);
      if (match && match[0]) {
        const id = match[0].split('=')[1];
        let filter = filterHandler.ruleIdQuery(id);
        filter.$state.isImplicit = false;
        filters.push(filter);
        this.$window.location.href = this.$window.location.href.replace(regex, '');
      }

      if (agent) filters.push(filterHandler.agentQuery(agent));
      filters.push(...this.addWazuhParamFilters());
      const discoverScope = await ModulesHelper.getDiscoverScope();
      discoverScope.loadFilters(filters, tab);
    } catch (error) {
      throw new Error('An error occurred while creating custom filters for visualizations');
    }
  }

  removeParam(key, sourceURL) {
    var rtn = sourceURL.split('?')[0],
      param,
      params_arr = [],
      queryString = sourceURL.indexOf('?') !== -1 ? sourceURL.split('?')[1] : '';
    if (queryString !== '') {
      params_arr = queryString.split('&');
      for (var i = params_arr.length - 1; i >= 0; i -= 1) {
        param = params_arr[i].split('=')[0];
        if (param === key) {
          params_arr.splice(i, 1);
        }
      }
      rtn = rtn + '?' + params_arr.join('&');
    }
    return rtn;
  }
  /**
    Find the `_w` parameter in the url and return a list of filters if it exists
   */
  addWazuhParamFilters() {
    const { _w } = this.$route.current.params;
    if (!_w) return [];
    const { filters } = rison.decode(_w);
    window.location.href = this.removeParam('_w', window.location.href);
    return filters || [];
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
   * GET TSC
   */
  async getTSC() {
    try {
      const tscTabs = [];
      const data = await this.genericReq.request('GET', '/api/tsc/all');
      if (!data.data) return [];
      for (const key in data.data) {
        tscTabs.push({ title: key, content: data.data[key] });
      }
      return tscTabs;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Assign given filter
   * @param {Object} filterHandler
   * @param {Object} tab
   * @param {Object} agent
   */
  assignFilters(filterHandler, tab, agent) {
    return this.af(filterHandler, tab, agent);
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
      start: data.start || false,
    };

    if (result.end && result.start) {
      result.duration = (new Date(result.end) - new Date(result.start)) / 1000 / 60;
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

  getCurrentPanel(tab, isAgent) {
    const target = isAgent ? this.agentTabs : this.overviewTabs;
    return target.hostMonitoringTabs.includes(tab)
      ? target.hostMonitoringTabs
      : target.systemAuditTabs.includes(tab)
      ? target.systemAuditTabs
      : target.securityTabs.includes(tab)
      ? target.securityTabs
      : target.complianceTabs.includes(tab)
      ? target.complianceTabs
      : false;
  }

  getTabsFromCurrentPanel(currentPanel, extensions, tabNames) {
    const keyExists = (key) => Object.keys(extensions).includes(key);
    const keyIsTrue = (key) => (extensions || [])[key];

    let tabs = [];
    currentPanel.forEach((x) => {
      if (!keyExists(x) || keyIsTrue(x)) {
        tabs.push({
          id: x,
          name: tabNames[x],
        });
      }
    });
    return tabs;
  }
}
