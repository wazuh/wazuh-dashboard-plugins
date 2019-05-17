/*
 * Wazuh app - Agents controller
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { FilterHandler } from '../../utils/filter-handler';
import { generateMetric } from '../../utils/generate-metric';
import { TabNames } from '../../utils/tab-names';
import * as FileSaver from '../../services/file-saver';
import { TabDescription } from '../../../server/reporting/tab-description';
import {
  metricsAudit,
  metricsVulnerability,
  metricsScap,
  metricsCiscat,
  metricsVirustotal
} from '../../utils/agents-metrics';

import { ConfigurationHandler } from '../../utils/config-handler';
import { timefilter } from 'ui/timefilter';

export class AgentsController {
  /**
   * Class constructor
   * @param {Object} $scope
   * @param {Object} $location
   * @param {Object} $rootScope
   * @param {Object} appState
   * @param {Object} apiReq
   * @param {Object} errorHandler
   * @param {Object} tabVisualizations
   * @param {Object} shareAgent
   * @param {Object} commonData
   * @param {Object} reportingService
   * @param {Object} visFactoryService
   * @param {Object} csvReq
   * @param {Object} wzTableFilter
   */
  constructor(
    $scope,
    $location,
    $rootScope,
    appState,
    apiReq,
    errorHandler,
    tabVisualizations,
    shareAgent,
    commonData,
    reportingService,
    visFactoryService,
    csvReq,
    wzTableFilter,
    $mdDialog,
    groupHandler,
    wazuhConfig,
    timeService
  ) {
    this.$scope = $scope;
    this.$location = $location;
    this.$rootScope = $rootScope;
    this.appState = appState;
    this.apiReq = apiReq;
    this.errorHandler = errorHandler;
    this.tabVisualizations = tabVisualizations;
    this.shareAgent = shareAgent;
    this.commonData = commonData;
    this.reportingService = reportingService;
    this.visFactoryService = visFactoryService;
    this.csvReq = csvReq;
    this.wzTableFilter = wzTableFilter;
    this.$mdDialog = $mdDialog;
    this.groupHandler = groupHandler;
    this.wazuhConfig = wazuhConfig;
    this.timeService = timeService;

    // Config on-demand
    this.$scope.isArray = Array.isArray;
    this.configurationHandler = new ConfigurationHandler(apiReq, errorHandler);
    this.$scope.currentConfig = null;
    this.$scope.configurationTab = '';
    this.$scope.configurationSubTab = '';
    this.$scope.integrations = {};
    this.$scope.selectedItem = 0;
    this.targetLocation = null;
    this.ignoredTabs = ['syscollector', 'welcome', 'configuration'];

    this.$scope.showSyscheckFiles = false;
    this.$scope.showScaScan = false;

    this.$scope.editGroup = false;
    this.$scope.addingGroupToAgent = false;

    this.$scope.lookingSca = false;
    this.$scope.expandArray = [
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false
    ];
  }

  /**
   * On controller loads
   */
  $onInit() {
    const savedTimefilter = this.commonData.getTimefilter();
    if (savedTimefilter) {
      timefilter.setTime(savedTimefilter);
      this.commonData.removeTimefilter();
    }

    this.$scope.TabDescription = TabDescription;

    this.$rootScope.reportStatus = false;

    this.$location.search('_a', null);
    this.filterHandler = new FilterHandler(this.appState.getCurrentPattern());
    this.visFactoryService.clearAll();

    const currentApi = JSON.parse(this.appState.getCurrentAPI()).id;
    const extensions = this.appState.getExtensions(currentApi);
    this.$scope.extensions = extensions;

    // Getting possible target location
    this.targetLocation = this.shareAgent.getTargetLocation();

    if (this.targetLocation && typeof this.targetLocation === 'object') {
      this.$scope.tabView = this.targetLocation.subTab;
      this.$scope.tab = this.targetLocation.tab;
    } else {
      this.$scope.tabView = this.commonData.checkTabViewLocation();
      this.$scope.tab = this.commonData.checkTabLocation();
    }

    this.tabHistory = [];
    if (!this.ignoredTabs.includes(this.$scope.tab))
      this.tabHistory.push(this.$scope.tab);

    // Tab names
    this.$scope.tabNames = TabNames;

    this.tabVisualizations.assign('agents');

    this.$scope.hostMonitoringTabs = ['general', 'fim', 'syscollector'];
    this.$scope.systemAuditTabs = ['pm', 'sca', 'audit', 'oscap', 'ciscat'];
    this.$scope.securityTabs = ['vuls', 'virustotal', 'osquery', 'docker'];
    this.$scope.complianceTabs = ['pci', 'gdpr'];

    /**
     * This check if given array of items contais a single given item
     * @param {Object} item
     * @param {Array<Object>} array
     */
    this.$scope.inArray = (item, array) =>
      item && Array.isArray(array) && array.includes(item);

    this.$scope.switchSubtab = async (
      subtab,
      force = false,
      onlyAgent = false,
      sameTab = true,
      preserveDiscover = false
    ) => this.switchSubtab(subtab, force, onlyAgent, sameTab, preserveDiscover);

    this.changeAgent = false;

    this.$scope.switchTab = (tab, force = false) => this.switchTab(tab, force);

    this.$scope.getAgentStatusClass = agentStatus =>
      agentStatus === 'Active' ? 'teal' : 'red';

    this.$scope.formatAgentStatus = agentStatus => {
      return ['Active', 'Disconnected'].includes(agentStatus)
        ? agentStatus
        : 'Never connected';
    };
    this.$scope.getAgent = async newAgentId => this.getAgent(newAgentId);
    this.$scope.goGroups = (agent, group) => this.goGroups(agent, group);
    this.$scope.downloadCsv = async (path, fileName, filters = []) =>
      this.downloadCsv(path, fileName, filters);

    this.$scope.search = (term, specificPath) =>
      this.$scope.$broadcast('wazuhSearch', { term, specificPath });

    this.$scope.searchSyscheckFile = (term, specificFilter) =>
      this.$scope.$broadcast('wazuhSearch', { term, specificFilter });

    this.$scope.searchRootcheck = (term, specificFilter) =>
      this.$scope.$broadcast('wazuhSearch', { term, specificFilter });

    this.$scope.launchRootcheckScan = () => this.launchRootcheckScan();
    this.$scope.launchSyscheckScan = () => this.launchSyscheckScan();

    this.$scope.startVis2Png = () => this.startVis2Png();

    this.$scope.$on('$destroy', () => {
      this.visFactoryService.clearAll();
    });

    this.$scope.isArray = Array.isArray;

    this.$scope.goGroup = () => {
      this.shareAgent.setAgent(this.$scope.agent);
      this.$location.path('/manager/groups');
    };

    this.$scope.restartAgent = async agent => {
      this.$scope.restartingAgent = true;
      try {
        const data = await this.apiReq.request(
          'PUT',
          `/agents/${agent.id}/restart`,
          {}
        );
        const result = ((data || {}).data || {}).data || false;
        const failed =
          result &&
          Array.isArray(result.failed_ids) &&
          result.failed_ids.length;
        if (failed) {
          throw new Error(result.failed_ids[0].error.message);
        } else if (result) {
          this.errorHandler.info(result.msg);
        } else {
          throw new Error('Unexpected error upgrading agent');
        }
        this.$scope.restartingAgent = false;
      } catch (error) {
        this.errorHandler.handle(error);
        this.$scope.restartingAgent = false;
      }
      this.$scope.$applyAsync();
    };

    const configuration = this.wazuhConfig.getConfig();
    this.$scope.adminMode = !!(configuration || {}).admin;

    //Load
    try {
      this.$scope.getAgent();
    } catch (e) {
      this.errorHandler.handle(
        'Unexpected exception loading controller',
        'Agents'
      );
    }

    // Config on demand
    this.$scope.getXML = () => this.configurationHandler.getXML(this.$scope);
    this.$scope.getJSON = () => this.configurationHandler.getJSON(this.$scope);
    this.$scope.isString = item => typeof item === 'string';
    this.$scope.hasSize = obj =>
      obj && typeof obj === 'object' && Object.keys(obj).length;
    this.$scope.offsetTimestamp = (text, time) => this.offsetTimestamp(text, time);
    this.$scope.switchConfigTab = (
      configurationTab,
      sections,
      navigate = true
    ) => {
      this.$scope.navigate = navigate;
      try {
        this.$scope.configSubTab = JSON.stringify({
          configurationTab: configurationTab,
          sections: sections
        });
        if (!this.$location.search().configSubTab) {
          this.appState.setSessionStorageItem(
            'configSubTab',
            this.$scope.configSubTab
          );
          this.$location.search('configSubTab', true);
        }
      } catch (error) {
        this.errorHandler.handle(error, 'Set configuration path');
      }
      this.configurationHandler.switchConfigTab(
        configurationTab,
        sections,
        this.$scope,
        this.$scope.agent.id
      );
    };

    this.$scope.switchWodle = (wodleName, navigate = true) => {
      this.$scope.navigate = navigate;
      this.$scope.configWodle = wodleName;
      if (!this.$location.search().configWodle) {
        this.$location.search('configWodle', this.$scope.configWodle);
      }
      this.configurationHandler.switchWodle(
        wodleName,
        this.$scope,
        this.$scope.agent.id
      );
    };

    this.$scope.switchConfigurationTab = (configurationTab, navigate) => {
      // Check if configuration is synced
      this.$scope.isSynchronized = this.checkSync();
      this.$scope.navigate = navigate;
      this.configurationHandler.switchConfigurationTab(
        configurationTab,
        this.$scope
      );
      if (!this.$scope.navigate) {
        const configSubTab = this.$location.search().configSubTab;
        if (configSubTab) {
          try {
            const config = this.appState.getSessionStorageItem('configSubTab');
            const configSubTabObj = JSON.parse(config);
            this.$scope.switchConfigTab(
              configSubTabObj.configurationTab,
              configSubTabObj.sections,
              false
            );
          } catch (error) {
            this.errorHandler.handle(error, 'Get configuration path');
          }
        } else {
          const configWodle = this.$location.search().configWodle;
          if (configWodle) {
            this.$scope.switchWodle(configWodle, false);
          }
        }
      } else {
        this.$location.search('configSubTab', null);
        this.appState.removeSessionStorageItem('configSubTab');
        this.$location.search('configWodle', null);
      }
    };
    this.$scope.switchConfigurationSubTab = configurationSubTab => {
      this.configurationHandler.switchConfigurationSubTab(
        configurationSubTab,
        this.$scope
      );
      if (configurationSubTab === 'pm-sca') {
        this.$scope.currentConfig.sca = this.configurationHandler.parseWodle(
          this.$scope.currentConfig,
          'sca'
        );
      }
    };
    this.$scope.updateSelectedItem = i => (this.$scope.selectedItem = i);
    this.$scope.getIntegration = list =>
      this.configurationHandler.getIntegration(list, this.$scope);

    this.$scope.switchSyscheckFiles = () => {
      this.$scope.showSyscheckFiles = !this.$scope.showSyscheckFiles;
      if (!this.$scope.showSyscheckFiles) {
        this.$scope.$emit('changeTabView', {
          tabView: this.$scope.tabView
        });
      }
      this.$scope.$applyAsync();
    };

    this.$scope.switchScaScan = () => {
      this.$scope.lookingSca = false;
      this.$scope.showScaScan = !this.$scope.showScaScan;
      if (!this.$scope.showScaScan) {
        this.$scope.$emit('changeTabView', {
          tabView: this.$scope.tabView
        });
      }
      this.$scope.$applyAsync();
    };

    this.$scope.goDiscover = () => this.goDiscover();

    this.$scope.$on('$routeChangeStart', () => {
      return this.appState.removeSessionStorageItem('configSubTab');
    });

    this.$scope.switchGroupEdit = () => {
      this.$scope.addingGroupToAgent = false;
      this.switchGroupEdit();
    };

    this.$scope.showConfirmAddGroup = group => {
      this.$scope.addingGroupToAgent = this.$scope.addingGroupToAgent
        ? false
        : group;
    };

    this.$scope.cancelAddGroup = () => (this.$scope.addingGroupToAgent = false);

    this.$scope.loadScaChecks = policy =>
      (this.$scope.lookingSca = { ...policy, id: policy.policy_id });
    this.$scope.closeScaChecks = () => (this.$scope.lookingSca = false);

    this.$scope.confirmAddGroup = group => {
      this.groupHandler
        .addAgentToGroup(group, this.$scope.agent.id)
        .then(() =>
          this.apiReq.request('GET', `/agents/${this.$scope.agent.id}`, {})
        )
        .then(agent => {
          this.$scope.agent.group = agent.data.data.group;
          this.$scope.groups = this.$scope.groups.filter(
            item => !agent.data.data.group.includes(item)
          );
          this.$scope.addingGroupToAgent = false;
          this.$scope.editGroup = false;
          this.errorHandler.info(`Group ${group} has been added.`);
          this.$scope.$applyAsync();
        })
        .catch(error => {
          this.$scope.editGroup = false;
          this.$scope.addingGroupToAgent = false;
          this.errorHandler.handle(
            error.message || error,
            'Error adding group to agent'
          );
        });
    };

    this.$scope.expand = i => this.expand(i);
  }
  /**
   * Create metric for given object
   * @param {*} metricsObject
   */
  createMetrics(metricsObject) {
    for (let key in metricsObject) {
      this.$scope[key] = () => generateMetric(metricsObject[key]);
    }
  }

  /**
   * Classify metrics for create the suitable one
   * @param {*} tab
   * @param {*} subtab
   */
  checkMetrics(tab, subtab) {
    if (subtab === 'panels') {
      switch (tab) {
        case 'audit':
          this.createMetrics(metricsAudit);
          break;
        case 'vuls':
          this.createMetrics(metricsVulnerability);
          break;
        case 'oscap':
          this.createMetrics(metricsScap);
          break;
        case 'ciscat':
          this.createMetrics(metricsCiscat);
          break;
        case 'virustotal':
          this.createMetrics(metricsVirustotal);
          break;
      }
    }
  }

  // Switch subtab
  async switchSubtab(
    subtab,
    force = false,
    onlyAgent = false,
    sameTab = true,
    preserveDiscover = false
  ) {
    try {
      if (this.$scope.tabView === subtab && !force) return;

      this.visFactoryService.clear(onlyAgent);
      this.$location.search('tabView', subtab);
      const localChange =
        subtab === 'panels' && this.$scope.tabView === 'discover' && sameTab;
      this.$scope.tabView = subtab;

      if (
        (subtab === 'panels' ||
          (this.targetLocation &&
            typeof this.targetLocation === 'object' &&
            this.targetLocation.subTab === 'discover' &&
            subtab === 'discover')) &&
        !this.ignoredTabs.includes(this.$scope.tab)
      ) {
        const condition =
          !this.changeAgent && (localChange || preserveDiscover);
        await this.visFactoryService.buildAgentsVisualizations(
          this.filterHandler,
          this.$scope.tab,
          subtab,
          condition,
          this.$scope.agent.id
        );

        this.changeAgent = false;
      } else {
        this.$scope.$emit('changeTabView', {
          tabView: this.$scope.tabView
        });
      }

      this.checkMetrics(this.$scope.tab, subtab);

      return;
    } catch (error) {
      this.errorHandler.handle(error, 'Agents');
      return;
    }
  }

  /**
   * Switch tab
   * @param {*} tab
   * @param {*} force
   */
  async switchTab(tab, force = false) {
    this.falseAllExpand();
    if (this.ignoredTabs.includes(tab)) {
      this.commonData.setRefreshInterval(timefilter.getRefreshInterval());
      timefilter.setRefreshInterval({ pause: true, value: 0 });
    } else if (this.ignoredTabs.includes(this.$scope.tab)) {
      timefilter.setRefreshInterval(this.commonData.getRefreshInterval());
    }

    // Update agent status
    try {
      if ((this.$scope || {}).agent || false) {
        const agentInfo = await this.apiReq.request(
          'GET',
          `/agents/${this.$scope.agent.id}`,
          { select: 'status' }
        );
        this.$scope.agent.status =
          (((agentInfo || {}).data || {}).data || {}).status ||
          this.$scope.agent.status;
      }
    } catch (error) { } // eslint-disable-line

    try {
      this.$scope.showSyscheckFiles = false;
      this.$scope.showScaScan = false;
      if (tab === 'pci') {
        const pciTabs = await this.commonData.getPCI();
        this.$scope.pciTabs = pciTabs;
        this.$scope.selectedPciIndex = 0;
      }
      if (tab === 'gdpr') {
        const gdprTabs = await this.commonData.getPCI();
        this.$scope.gdprTabs = gdprTabs;
        this.$scope.selectedGdprIndex = 0;
      }

      if (tab === 'sca') {
        try {
          this.$scope.loadSca = true;
          const policies = await this.apiReq.request(
            'GET',
            `/sca/${this.$scope.agent.id}`,
            {}
          );
          this.$scope.policies =
            (((policies || {}).data || {}).data || {}).items || [];
        } catch (error) {
          this.$scope.policies = [];
        }
        this.$scope.loadSca = false;
      }

      if (tab === 'syscollector')
        try {
          await this.loadSyscollector(this.$scope.agent.id);
        } catch (error) { } // eslint-disable-line
      if (tab === 'configuration') {
        this.$scope.switchConfigurationTab('welcome');
      } else {
        this.configurationHandler.reset(this.$scope);
      }
      this.$scope.lookingSca = false;
      if (!this.ignoredTabs.includes(tab)) this.tabHistory.push(tab);
      if (this.tabHistory.length > 2)
        this.tabHistory = this.tabHistory.slice(-2);
      this.tabVisualizations.setTab(tab);

      if (this.$scope.tab === tab && !force) {
        this.$scope.$applyAsync();
        return;
      }

      const onlyAgent = this.$scope.tab === tab && force;
      const sameTab = this.$scope.tab === tab;
      this.$location.search('tab', tab);
      const preserveDiscover =
        this.tabHistory.length === 2 &&
        this.tabHistory[0] === this.tabHistory[1] &&
        !force;
      this.$scope.tab = tab;

      const targetSubTab =
        this.targetLocation && typeof this.targetLocation === 'object'
          ? this.targetLocation.subTab
          : 'panels';

      if (!this.ignoredTabs.includes(this.$scope.tab)) {
        this.$scope.switchSubtab(
          targetSubTab,
          true,
          onlyAgent,
          sameTab,
          preserveDiscover
        );
      }

      this.shareAgent.deleteTargetLocation();
      this.targetLocation = null;
      this.$scope.$applyAsync();
    } catch (error) {
      return Promise.reject(error);
    }
  }

  goDiscover() {
    this.targetLocation = {
      tab: 'general',
      subTab: 'discover'
    };
    return this.switchTab('general');
  }

  // Agent data

  /**
   * Checks rootcheck of selected agent
   */
  validateRootCheck() {
    const result = this.commonData.validateRange(this.$scope.agent.rootcheck);
    this.$scope.agent.rootcheck = result;
  }

  /**
   * Checks syscheck of selected agent
   */
  validateSysCheck() {
    const result = this.commonData.validateRange(this.$scope.agent.syscheck);
    this.$scope.agent.syscheck = result;
  }

  /**
   * Checks if configuration is sync
   */
  async checkSync() {
    const isSync = await this.apiReq.request(
      'GET',
      `/agents/${this.$scope.agent.id}/group/is_sync`,
      {}
    );
    return (((isSync || {}).data || {}).data || {}).synced || false;
  }

  /**
   * Get the needed data for load syscollector
   * @param {*} id
   */
  async loadSyscollector(id) {
    try {
      // Continue API requests if we do have Syscollector enabled
      // Fetch Syscollector data
      const data = await Promise.all([
        this.apiReq.request('GET', `/syscollector/${id}/hardware`, {}),
        this.apiReq.request('GET', `/syscollector/${id}/os`, {}),
        this.apiReq.request('GET', `/syscollector/${id}/ports`, { limit: 1 }),
        this.apiReq.request('GET', `/syscollector/${id}/packages`, {
          limit: 1,
          select: 'scan_time'
        }),
        this.apiReq.request('GET', `/syscollector/${id}/processes`, {
          limit: 1,
          select: 'scan_time'
        })
      ]);

      const result = data.map(item => ((item || {}).data || {}).data || false);

      const [
        hardwareResponse,
        osResponse,
        portsResponse,
        packagesDateResponse,
        processesDateResponse
      ] = result;

      // This API call may fail so we put it out of Promise.all
      let netifaceResponse = false;
      try {
        const resultNetiface = await this.apiReq.request(
          'GET',
          `/syscollector/${id}/netiface`,
          {}
        );
        netifaceResponse = ((resultNetiface || {}).data || {}).data || false;
      } catch (error) { } // eslint-disable-line

      // This API call may fail so we put it out of Promise.all
      let netaddrResponse = false;
      try {
        const resultNetaddrResponse = await this.apiReq.request(
          'GET',
          `/syscollector/${id}/netaddr`,
          { limit: 1 }
        );
        netaddrResponse =
          ((resultNetaddrResponse || {}).data || {}).data || false;
      } catch (error) { } // eslint-disable-line

      // Before proceeding, syscollector data is an empty object
      this.$scope.syscollector = {};

      const packagesDate = packagesDateResponse
        ? { ...packagesDateResponse }
        : false;
      const processesDate = processesDateResponse
        ? { ...processesDateResponse }
        : false;

      // Fill syscollector object
      this.$scope.syscollector = {
        hardware:
          typeof hardwareResponse === 'object' &&
            Object.keys(hardwareResponse).length
            ? { ...hardwareResponse }
            : false,
        os:
          typeof osResponse === 'object' && Object.keys(osResponse).length
            ? { ...osResponse }
            : false,
        netiface: netifaceResponse ? { ...netifaceResponse } : false,
        ports: portsResponse ? { ...portsResponse } : false,
        netaddr: netaddrResponse ? { ...netaddrResponse } : false,
        packagesDate: ((packagesDate || {}).items || []).length
          ? packagesDate.items[0].scan_time
          : '-',
        processesDate: ((processesDate || {}).items || []).length
          ? processesDate.items[0].scan_time
          : '-'
      };

      return;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Get all data from agent
   * @param {*} newAgentId
   */
  async getAgent(newAgentId) {
    try {
      this.$scope.emptyAgent = false;
      this.$scope.isSynchronized = false;
      this.$scope.load = true;
      this.changeAgent = true;

      const globalAgent = this.shareAgent.getAgent();

      const id = this.commonData.checkLocationAgentId(newAgentId, globalAgent);

      const data = [false, false, false];

      try {
        data[0] = await this.apiReq.request('GET', `/agents/${id}`, {});
      } catch (error) { } //eslint-disable-line

      try {
        data[1] = await this.apiReq.request(
          'GET',
          `/syscheck/${id}/last_scan`,
          {}
        );
      } catch (error) { } //eslint-disable-line

      try {
        data[2] = await this.apiReq.request(
          'GET',
          `/rootcheck/${id}/last_scan`,
          {}
        );
      } catch (error) { } //eslint-disable-line

      const result = data.map(item => ((item || {}).data || {}).data || false);

      const [agentInfo, syscheckLastScan, rootcheckLastScan] = result;

      // Agent
      this.$scope.agent = agentInfo;
      if (this.$scope.agent.os) {
        this.$scope.agentOS =
          this.$scope.agent.os.name + ' ' + this.$scope.agent.os.version;
        this.$scope.agent.isLinuxOS = this.$scope.agent.os.uname.includes(
          'Linux'
        );
      } else {
        this.$scope.agentOS = '-';
        this.$scope.agent.isLinuxOS = false;
      }

      // Syscheck
      this.$scope.agent.syscheck = syscheckLastScan;
      this.validateSysCheck();

      // Rootcheck
      this.$scope.agent.rootcheck = rootcheckLastScan;
      this.validateRootCheck();

      await this.$scope.switchTab(this.$scope.tab, true);

      const groups = await this.apiReq.request('GET', '/agents/groups', {});
      this.$scope.groups = groups.data.data.items
        .map(item => item.name)
        .filter(
          item =>
            this.$scope.agent.group && !this.$scope.agent.group.includes(item)
        );

      const outdatedAgents = await this.apiReq.request(
        'GET',
        '/agents/outdated/',
        {}
      );
      this.$scope.agent.outdated = outdatedAgents.data.data.items
        .map(x => x.id)
        .find(x => x === this.$scope.agent.id);

      if (this.$scope.agent.outdated) {
        if (
          this.appState.getSessionStorageItem(
            `updatingAgent${this.$scope.agent.id}`
          )
        ) {
          this.$scope.agent.upgrading = true;
        }
      } else {
        if (
          this.appState.getSessionStorageItem(
            `updatingAgent${this.$scope.agent.id}`
          )
        ) {
          this.appState.removeSessionStorageItem(
            `updatingAgent${this.$scope.agent.id}`
          );
          this.$scope.agent.outdated = false;
        }
        this.$scope.$applyAsync();
      }

      this.$scope.load = false;
      this.$scope.$applyAsync();
      return;
    } catch (error) {
      if (!this.$scope.agent) {
        if ((error || {}).status === -1) {
          this.$scope.emptyAgent = 'Wazuh API timeout.';
        }
      }
      this.errorHandler.handle(error, 'Agents');
      if (
        error &&
        typeof error === 'string' &&
        error.includes('Agent does not exist')
      ) {
        this.$location.search('agent', null);
        this.$location.path('/agents-preview');
      }
    }
    this.$scope.load = false;
    this.$scope.$applyAsync();
    return;
  }

  switchGroupEdit() {
    this.$scope.editGroup = !!!this.$scope.editGroup;
    this.$scope.$applyAsync();
  }

  /**
 * This adds timezone offset to a given date
 * @param {String} binding_text
 * @param {String} date
 */
  offsetTimestamp = (text, time) => {
    try {
      return text + this.timeService.offset(time);
    } catch (error) {
      return `${text}${time} (UTC)`;
    }
  }

  /**
   * Navigate to the groups of an agent
   * @param {*} agent
   * @param {*} group
   */
  goGroups(agent, group) {
    this.appState.setNavigation({ status: true });
    this.visFactoryService.clearAll();
    this.shareAgent.setAgent(agent, group);
    this.$location.search('tab', 'groups');
    this.$location.search('navigation', true);
    this.$location.path('/manager');
  }

  /**
   * Get full data on CSV format from a path
   * @param {*} path path with data to convert
   * @param {*} fileName Output file name
   * @param {*} filters Filters to apply
   */
  async downloadCsv(path, fileName, filters = []) {
    try {
      this.errorHandler.info(
        'Your download should begin automatically...',
        'CSV'
      );
      const currentApi = JSON.parse(this.appState.getCurrentAPI()).id;
      const output = await this.csvReq.fetch(path, currentApi, filters);
      const blob = new Blob([output], { type: 'text/csv' }); // eslint-disable-line

      FileSaver.saveAs(blob, fileName);
    } catch (error) {
      this.errorHandler.handle(error, 'Download CSV');
    }
    return;
  }

  /**
   * Transform a visualization into an image
   */
  startVis2Png() {
    const syscollectorFilters = [];
    if (this.$scope.tab === 'syscollector' && (this.$scope.agent || {}).id) {
      syscollectorFilters.push(
        this.filterHandler.managerQuery(
          this.appState.getClusterInfo().cluster,
          true
        )
      );
      syscollectorFilters.push(
        this.filterHandler.agentQuery(this.$scope.agent.id)
      );
    }
    this.reportingService.startVis2Png(
      this.$scope.tab,
      (this.$scope.agent || {}).id || true,
      syscollectorFilters.length ? syscollectorFilters : null
    );
  }

  async launchRootcheckScan() {
    try {
      const isActive = ((this.$scope.agent || {}).status || '') === 'Active';
      if (!isActive) {
        throw new Error('Agent is not active');
      }
      await this.apiReq.request(
        'PUT',
        `/rootcheck/${this.$scope.agent.id}`,
        {}
      );
      this.errorHandler.info(
        `Policy monitoring scan launched successfully on agent ${
        this.$scope.agent.id
        }`,
        ''
      );
    } catch (error) {
      this.errorHandler.handle(error);
    }
    return;
  }

  async launchSyscheckScan() {
    try {
      const isActive = ((this.$scope.agent || {}).status || '') === 'Active';
      if (!isActive) {
        throw new Error('Agent is not active');
      }
      await this.apiReq.request('PUT', `/syscheck/${this.$scope.agent.id}`, {});
      this.errorHandler.info(
        `FIM scan launched successfully on agent ${this.$scope.agent.id}`,
        ''
      );
    } catch (error) {
      this.errorHandler.handle(error);
    }
    return;
  }

  falseAllExpand() {
    this.$scope.expandArray = [
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false
    ];
  }

  expand(i) {
    const oldValue = this.$scope.expandArray[i];
    this.falseAllExpand();
    this.$scope.expandArray[i] = !oldValue;
  }
}
