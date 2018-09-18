/*
 * Wazuh app - Agents controller
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import beautifier from '../../utils/json-beautifier';
import { uiModules } from 'ui/modules';
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

const app = uiModules.get('app/wazuh', []);

class AgentsController {
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
    wzTableFilter
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
  }

  $onInit() {
    this.$scope.TabDescription = TabDescription;

    this.$rootScope.reportStatus = false;

    this.$location.search('_a', null);
    this.filterHandler = new FilterHandler(this.appState.getCurrentPattern());
    this.visFactoryService.clearAll();

    const currentApi = JSON.parse(this.appState.getCurrentAPI()).id;
    const extensions = this.appState.getExtensions(currentApi);
    this.$scope.extensions = extensions;

    this.$scope.tabView = this.commonData.checkTabViewLocation();
    this.$scope.tab = this.commonData.checkTabLocation();

    this.tabHistory = [];
    if (
      this.$scope.tab !== 'configuration' &&
      this.$scope.tab !== 'welcome' &&
      this.$scope.tab !== 'syscollector'
    )
      this.tabHistory.push(this.$scope.tab);

    // Tab names
    this.$scope.tabNames = TabNames;

    this.tabVisualizations.assign('agents');

    this.$scope.hostMonitoringTabs = [
      'general',
      'fim',
      'configuration',
      'syscollector'
    ];
    this.$scope.systemAuditTabs = ['pm', 'audit', 'oscap', 'ciscat'];
    this.$scope.securityTabs = ['vuls', 'virustotal'];
    this.$scope.complianceTabs = ['pci', 'gdpr'];

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
    this.$scope.goGroups = agent => this.goGroups(agent);
    this.$scope.analyzeAgents = async searchTerm =>
      this.analyzeAgents(searchTerm);
    this.$scope.downloadCsv = async data_path => this.downloadCsv(data_path);

    this.$scope.search = (term, specificPath) =>
      this.$scope.$broadcast('wazuhSearch', { term, specificPath });

    this.$scope.startVis2Png = () => this.startVis2Png();

    this.$scope.$on('$destroy', () => {
      this.visFactoryService.clearAll();
    });

    // PCI and GDPR requirements
    Promise.all([this.commonData.getPCI(), this.commonData.getGDPR()])
      .then(data => {
        this.$scope.pciTabs = data[0];
        this.$scope.selectedPciIndex = 0;
        this.$scope.gdprTabs = data[1];
        this.$scope.selectedGdprIndex = 0;
      })
      .catch(error => this.errorHandler.handle(error, 'Agents'));

    this.$scope.isArray = Array.isArray;

    this.$scope.getAgentConfig = newAgentId => {
      if (newAgentId) {
        this.$location.search('agent', newAgentId);
      }
      this.firstLoad();
    };

    this.$scope.goGroup = () => {
      this.shareAgent.setAgent(this.$scope.agent);
      this.$location.path('/manager/groups');
    };

    //Load
    try {
      this.$scope.getAgent();
    } catch (e) {
      this.errorHandler.handle(
        'Unexpected exception loading controller',
        'Agents'
      );
    }
  }

  createMetrics(metricsObject) {
    for (let key in metricsObject) {
      this.$scope[key] = () => generateMetric(metricsObject[key]);
    }
  }

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
        subtab === 'panels' &&
        this.$scope.tab !== 'configuration' &&
        this.$scope.tab !== 'welcome' &&
        this.$scope.tab !== 'syscollector'
      ) {
        const condition =
          (!this.changeAgent && localChange) ||
          (!this.changeAgent && preserveDiscover);
        await this.visFactoryService.buildAgentsVisualizations(
          this.filterHandler,
          this.$scope.tab,
          subtab,
          condition,
          this.$scope.agent.id
        );
        this.changeAgent = false;
      } else {
        this.$rootScope.$emit('changeTabView', {
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

  // Switch tab
  switchTab(tab, force = false) {
    if (tab !== 'configuration' && tab !== 'welcome' && tab !== 'syscollector')
      this.tabHistory.push(tab);
    if (this.tabHistory.length > 2) this.tabHistory = this.tabHistory.slice(-2);
    this.tabVisualizations.setTab(tab);
    if (this.$scope.tab === tab && !force) return;
    const onlyAgent = this.$scope.tab === tab && force;
    const sameTab = this.$scope.tab === tab;
    this.$location.search('tab', tab);
    const preserveDiscover =
      this.tabHistory.length === 2 &&
      this.tabHistory[0] === this.tabHistory[1] &&
      !force;
    this.$scope.tab = tab;

    if (this.$scope.tab === 'configuration') {
      this.firstLoad();
    } else {
      this.$scope.switchSubtab(
        'panels',
        true,
        onlyAgent,
        sameTab,
        preserveDiscover
      );
    }
  }

  // Agent data

  validateRootCheck() {
    const result = this.commonData.validateRange(this.$scope.agent.rootcheck);
    this.$scope.agent.rootcheck = result;
  }

  validateSysCheck() {
    const result = this.commonData.validateRange(this.$scope.agent.syscheck);
    this.$scope.agent.syscheck = result;
  }

  async loadSyscollector(id) {
    try {
      const data = await Promise.all([
        this.apiReq.request('GET', `/syscollector/${id}/hardware`, {}),
        this.apiReq.request('GET', `/syscollector/${id}/os`, {}),
        this.apiReq.request('GET', `/syscollector/${id}/netiface`, {}),
        this.apiReq.request('GET', `/syscollector/${id}/ports`, {}),
        this.apiReq.request('GET', `/syscollector/${id}/packages`, {
          limit: 1,
          select: 'scan_time'
        }),
        this.apiReq.request('GET', `/syscollector/${id}/processes`, {
          limit: 1,
          select: 'scan_time'
        })
      ]);
      if (
        !data[0] ||
        !data[0].data ||
        !data[0].data.data ||
        typeof data[0].data.data !== 'object' ||
        !Object.keys(data[0].data.data).length ||
        !data[1] ||
        !data[1].data ||
        !data[1].data.data ||
        typeof data[1].data.data !== 'object' ||
        !Object.keys(data[1].data.data).length
      ) {
        this.$scope.syscollector = null;
      } else {
        const netiface = {};
        const ports = {};
        const packagesDate = {};
        const processesDate = {};
        if (data[2] && data[2].data && data[2].data.data)
          Object.assign(netiface, data[2].data.data);
        if (data[3] && data[3].data && data[3].data.data)
          Object.assign(ports, data[3].data.data);
        if (data[4] && data[4].data && data[4].data.data)
          Object.assign(packagesDate, data[4].data.data);
        if (data[5] && data[5].data && data[5].data.data)
          Object.assign(processesDate, data[5].data.data);
        this.$scope.syscollector = {
          hardware: data[0].data.data,
          os: data[1].data.data,
          netiface: netiface,
          ports: ports,
          packagesDate:
            packagesDate && packagesDate.items && packagesDate.items.length
              ? packagesDate.items[0].scan_time
              : 'Unknown',
          processesDate:
            processesDate && processesDate.items && processesDate.items.length
              ? processesDate.items[0].scan_time
              : 'Unknown'
        };
      }
      return;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async getAgent(newAgentId) {
    try {
      this.$scope.load = true;
      this.changeAgent = true;

      const globalAgent = this.shareAgent.getAgent();

      const id = this.commonData.checkLocationAgentId(newAgentId, globalAgent);

      if (this.$scope.tab === 'configuration') {
        await this.loadSyscollector(id);
        return this.$scope.getAgentConfig(id);
      }

      const data = await Promise.all([
        this.apiReq.request('GET', `/agents/${id}`, {}),
        this.apiReq.request('GET', `/syscheck/${id}/last_scan`, {}),
        this.apiReq.request('GET', `/rootcheck/${id}/last_scan`, {})
      ]);

      // Agent
      this.$scope.agent = data[0].data.data;
      if (this.$scope.agent.os) {
        this.$scope.agentOS =
          this.$scope.agent.os.name + ' ' + this.$scope.agent.os.version;
      } else {
        this.$scope.agentOS = 'Unknown';
      }

      // Syscheck
      this.$scope.agent.syscheck = data[1].data.data;
      this.validateSysCheck();

      // Rootcheck
      this.$scope.agent.rootcheck = data[2].data.data;
      this.validateRootCheck();

      this.$scope.switchTab(this.$scope.tab, true);

      await this.loadSyscollector(id);

      this.$scope.load = false;
      if (!this.$scope.$$phase) this.$scope.$digest();
      return;
    } catch (error) {
      this.errorHandler.handle(error, 'Agents');
    }
    return;
  }

  goGroups(agent) {
    this.visFactoryService.clearAll();
    this.shareAgent.setAgent(agent);
    this.$location.search('tab', 'groups');
    this.$location.path('/manager');
  }

  async analyzeAgents(searchTerm) {
    try {
      if (searchTerm) {
        const reqData = await this.apiReq.request('GET', '/agents', {
          search: searchTerm
        });
        return reqData.data.data.items.filter(item => item.id !== '000');
      } else {
        const reqData = await this.apiReq.request('GET', '/agents', {});
        return reqData.data.data.items.filter(item => item.id !== '000');
      }
    } catch (error) {
      this.errorHandler.handle(error, 'Agents');
    }
    return;
  }

  async downloadCsv(data_path) {
    try {
      this.errorHandler.info(
        'Your download should begin automatically...',
        'CSV'
      );
      const currentApi = JSON.parse(this.appState.getCurrentAPI()).id;
      const output = await this.csvReq.fetch(
        data_path,
        currentApi,
        this.wzTableFilter.get()
      );
      const blob = new Blob([output], { type: 'text/csv' }); // eslint-disable-line

      FileSaver.saveAs(blob, 'packages.csv');

      return;
    } catch (error) {
      this.errorHandler.handle(error, 'Download CSV');
    }
    return;
  }

  async firstLoad() {
    try {
      const globalAgent = this.shareAgent.getAgent();
      this.$scope.configurationError = false;
      this.$scope.load = true;

      const id = this.commonData.checkLocationAgentId(false, globalAgent);

      const data = await this.apiReq.request('GET', `/agents/${id}`, {});
      this.$scope.agent = data.data.data;
      this.$scope.groupName = this.$scope.agent.group;

      if (!this.$scope.groupName) {
        this.$scope.configurationError = true;
        this.$scope.load = false;
        if (!this.$scope.$$phase) this.$scope.$digest();
        return;
      }

      const configurationData = await this.apiReq.request(
        'GET',
        `/agents/groups/${this.$scope.groupName}/configuration`,
        {}
      );
      this.$scope.groupConfiguration = configurationData.data.data.items[0];
      this.$scope.rawJSON = beautifier.prettyPrint(
        configurationData.data.data.items
      );

      const agentGroups = await Promise.all([
        this.apiReq.request(
          'GET',
          `/agents/groups?search=${this.$scope.groupName}`,
          {}
        ),
        this.apiReq.request(
          'GET',
          `/agents/groups/${this.$scope.groupName}`,
          {}
        )
      ]);

      const groupMergedSum = agentGroups[0].data.data.items.filter(
        item => item.name === this.$scope.groupName
      );
      this.$scope.groupMergedSum = groupMergedSum.length
        ? groupMergedSum[0].mergedSum
        : 'Unknown';

      const agentMergedSum = agentGroups[1].data.data.items.filter(
        item => item.id === this.$scope.agent.id
      );
      this.$scope.agentMergedSum = agentMergedSum.length
        ? agentMergedSum[0].mergedSum
        : 'Unknown';

      this.$scope.isSynchronized =
        this.$scope.agentMergedSum === this.$scope.groupMergedSum &&
        ![this.$scope.agentMergedSum, this.$scope.groupMergedSum].includes(
          'Unknown'
        )
          ? true
          : false;

      this.$scope.load = false;

      if (this.$scope.tab !== 'configuration')
        this.$scope.switchTab(this.$scope.tab, true);

      if (!this.$scope.$$phase) this.$scope.$digest();
      return;
    } catch (error) {
      this.errorHandler.handle(error, 'Agents');
    }
    return;
  }
  /** End of agent configuration */

  startVis2Png() {
    const syscollectorFilters = [];
    if (
      this.$scope.tab === 'syscollector' &&
      this.$scope.agent &&
      this.$scope.agent.id
    ) {
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
      this.$scope.agent && this.$scope.agent.id ? this.$scope.agent.id : true,
      syscollectorFilters.length ? syscollectorFilters : null
    );
  }
}

app.controller('agentsController', AgentsController);
