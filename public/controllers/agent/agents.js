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
import { UnsupportedComponents } from '../../utils/components-os-support';
import {
  metricsGeneral,
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
    timeService,
    genericReq
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
    this.genericReq = genericReq;

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
    this.$scope.complianceTabs = ['pci', 'gdpr', 'hipaa', 'nist'];

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

    this.$scope.shouldShowComponent = (component) => this.shouldShowComponent(component);


    this.$scope.$on('$destroy', () => {
      this.visFactoryService.clearAll();
    });

    this.$scope.isArray = Array.isArray;

    this.$scope.goGroup = () => {
      this.shareAgent.setAgent(this.$scope.agent);
      this.$location.path('/manager/groups');
    };

    this.$scope.exportConfiguration = (enabledComponents) => {
      this.reportingService.startConfigReport(this.$scope.agent, 'agentConfig', enabledComponents);
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
    this.$scope.offsetTimestamp = (text, time) =>
      this.offsetTimestamp(text, time);
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
      this.checkSync();
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
        case 'general':
          this.createMetrics(metricsGeneral);
          break;
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
    if (!force && ((this.$scope || {}).agent || false)) {
      try {
        const agentInfo = await this.apiReq.request(
          'GET',
          `/agents/${this.$scope.agent.id}`,
          { select: 'status' }
        );
        this.$scope.agent.status =
          (((agentInfo || {}).data || {}).data || {}).status ||
          this.$scope.agent.status;
      } catch (error) {} // eslint-disable-line
    }

    try {
      this.$scope.showSyscheckFiles = false;
      this.$scope.showScaScan = false;
      if (tab === 'pci') {
        const pciTabs = await this.commonData.getPCI();
        this.$scope.pciTabs = pciTabs;
        this.$scope.selectedPciIndex = 0;
      }
      if (tab === 'gdpr') {
        const gdprTabs = await this.commonData.getGDPR();
        this.$scope.gdprTabs = gdprTabs;
        this.$scope.selectedGdprIndex = 0;
      }

      if (tab === 'hipaa') {
        const hipaaTabs = await this.commonData.getHIPAA();
        this.$scope.hipaaTabs = hipaaTabs;
        this.$scope.selectedHipaaIndex = 0;
      }

      if (tab === 'nist') {
        const nistTabs = await this.commonData.getNIST();
        this.$scope.nistTabs = nistTabs;
        this.$scope.selectedNistIndex = 0;
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
        } catch (error) {} // eslint-disable-line
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
    this.$scope.isSynchronized =
      (((isSync || {}).data || {}).data || {}).synced || false;
    this.$scope.$applyAsync();
  }

  /**
   * Get the needed data for load syscollector
   * @param {*} id
   */
  async loadSyscollector(id) {
    try {
      const syscollectorData = await this.genericReq.request(
        'GET',
        `/api/syscollector/${id}`
      );

      this.$scope.syscollector = (syscollectorData || {}).data || {};

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

      const data = await this.apiReq.request('GET', `/agents/${id}`, {});

      const agentInfo = ((data || {}).data || {}).data || false;

      // Agent
      this.$scope.agent = agentInfo;
      if (agentInfo && this.$scope.agent.os) {
        this.$scope.agentOS =
          this.$scope.agent.os.name + ' ' + this.$scope.agent.os.version;
        const isLinux = this.$scope.agent.os.uname.includes('Linux');
        this.$scope.agent.agentPlatform = isLinux ? 'linux' : this.$scope.agent.os.platform;
      } else {
        this.$scope.agentOS = '-';
        this.$scope.agent.agentPlatform = false;
      }

      await this.$scope.switchTab(this.$scope.tab, true);

      const groups = await this.apiReq.request('GET', '/agents/groups', {});
      this.$scope.groups = groups.data.data.items
        .map(item => item.name)
        .filter(
          item =>
            this.$scope.agent.group && !this.$scope.agent.group.includes(item)
        );

      this.loadWelcomeCardsProps();
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

  shouldShowComponent(component) {
    return !(UnsupportedComponents[this.$scope.agent.agentPlatform] || UnsupportedComponents['other']).includes(component);
  }

  cleanExtensions(extensions) {
    const result = {};
    for (const extension in extensions) {
      if (!(UnsupportedComponents[this.$scope.agent.agentPlatform] || UnsupportedComponents['other']).includes(extension)) {
        result[extension] = extensions[extension];
      }
    }
    return result;
  }

  /**
 * Get available welcome cards after getting the agent
 */
  loadWelcomeCardsProps() {
    this.$scope.welcomeCardsProps = {
      switchTab: tab => this.switchTab(tab),
      extensions: this.cleanExtensions(this.$scope.extensions),
      agent: this.$scope.agent,
      api: this.appState.getCurrentAPI(),
      setExtensions: (api, extensions) =>
        this.appState.setExtensions(api, extensions)
    };
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
  offsetTimestamp(text, time) {
    try {
      return text + this.timeService.offset(time);
    } catch (error) {
      return time !== '-' ? `${text}${time} (UTC)` : time;
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
        `Policy monitoring scan launched successfully on agent ${this.$scope.agent.id}`,
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
