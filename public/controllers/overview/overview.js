/*
 * Wazuh app - Overview controller
 * Copyright (C) 2018 Wazuh, Inc.
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
import { TabDescription } from '../../../server/reporting/tab-description';

import {
  metricsGeneral,
  metricsAudit,
  metricsVulnerability,
  metricsScap,
  metricsCiscat,
  metricsVirustotal,
  metricsOsquery
} from '../../utils/overview-metrics';

import { queryConfig } from '../../services/query-config';

export class OverviewController {
  constructor(
    $scope,
    $location,
    $rootScope,
    appState,
    errorHandler,
    apiReq,
    tabVisualizations,
    commonData,
    reportingService,
    visFactoryService,
    wazuhConfig
  ) {
    this.$scope = $scope;
    this.$location = $location;
    this.$rootScope = $rootScope;
    this.appState = appState;
    this.errorHandler = errorHandler;
    this.apiReq = apiReq;
    this.tabVisualizations = tabVisualizations;
    this.commonData = commonData;
    this.reportingService = reportingService;
    this.visFactoryService = visFactoryService;
    this.wazuhConfig = wazuhConfig;
  }

  $onInit() {
    this.wodlesConfiguration = false;
    this.TabDescription = TabDescription;
    this.$rootScope.reportStatus = false;

    this.$location.search('_a', null);
    this.filterHandler = new FilterHandler(this.appState.getCurrentPattern());
    this.visFactoryService.clearAll();

    const currentApi = JSON.parse(this.appState.getCurrentAPI()).id;
    const extensions = this.appState.getExtensions(currentApi);
    this.extensions = extensions;

    this.wzMonitoringEnabled = false;

    // Tab names
    this.tabNames = TabNames;

    this.tabView = this.commonData.checkTabViewLocation();
    this.tab = this.commonData.checkTabLocation();

    this.tabHistory = [];
    if (this.tab !== 'welcome') this.tabHistory.push(this.tab);

    // This object represents the number of visualizations per tab; used to show a progress bar
    this.tabVisualizations.assign('overview');

    this.hostMonitoringTabs = ['general', 'fim', 'aws'];
    this.systemAuditTabs = ['pm', 'audit', 'oscap', 'ciscat'];
    this.securityTabs = ['vuls', 'virustotal', 'osquery'];
    this.complianceTabs = ['pci', 'gdpr'];

    this.wodlesConfiguration = null;

    this.init();

    this.$scope.$on('$destroy', () => {
      this.visFactoryService.clearAll();
    });
  }

  inArray(item, array) {
    return item && Array.isArray(array) && array.includes(item);
  }

  createMetrics(metricsObject) {
    for (const key in metricsObject) {
      this[key] = () => generateMetric(metricsObject[key]);
    }
  }

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
        case 'osquery':
          this.createMetrics(metricsOsquery);
          break;
      }
    }
  }

  // Switch subtab
  async switchSubtab(
    subtab,
    force = false,
    sameTab = true,
    preserveDiscover = false
  ) {
    try {
      if (this.tabView === subtab && !force) return;

      this.visFactoryService.clear();
      this.$location.search('tabView', subtab);
      const localChange =
        subtab === 'panels' && this.tabView === 'discover' && sameTab;
      this.tabView = subtab;

      if (subtab === 'panels' && this.tab !== 'welcome') {
        await this.visFactoryService.buildOverviewVisualizations(
          this.filterHandler,
          this.tab,
          subtab,
          localChange || preserveDiscover
        );
      } else {
        this.$rootScope.$emit('changeTabView', { tabView: this.tabView });
      }

      this.checkMetrics(this.tab, subtab);
    } catch (error) {
      this.errorHandler.handle(error, 'Overview');
    }
    if (!this.$scope.$$phase) this.$scope.$digest();
    return;
  }

  calculateWodleTagFromTab(tab) {
    if (tab === 'aws') return 'aws-s3';
    return false;
  }

  filterWodle(tab) {
    try {
      this.wodlesConfiguration = false;
      const tag = this.calculateWodleTagFromTab(tab);
      let result = [];
      if (
        tag &&
        this.wodlesConfiguration &&
        this.wodlesConfiguration['wmodules-wmodules'] &&
        this.wodlesConfiguration['wmodules-wmodules'].wmodules
      ) {
        result = this.wodlesConfiguration['wmodules-wmodules'].wmodules.filter(
          item => typeof item[tag] !== 'undefined'
        );
      }
      if (result.length) {
        this.wodlesConfiguration = result[0];
      }
    } catch (error) {} // eslint-disable-line

    if (!this.$scope.$$phase) this.$scope.$digest();
  }

  async fetchWodles() {
    try {
      this.wodlesConfiguration = await queryConfig(
        '000',
        [{ component: 'wmodules', configuration: 'wmodules' }],
        this.apiReq
      );
    } catch (error) {
      this.wodlesConfiguration = false;
    }
    return;
  }

  // Switch tab
  async switchTab(newTab, force = false) {
    try {
      if (newTab !== 'welcome') {
        await this.fetchWodles();
      }

      if (
        newTab === 'welcome' &&
        typeof this.agentsCountTotal === 'undefined'
      ) {
        await this.getSummary();
      }

      if (newTab === 'pci') {
        const pciTabs = await this.commonData.getPCI();
        this.pciTabs = pciTabs;
        this.selectedPciIndex = 0;
      }

      if (newTab === 'gdpr') {
        const gdprTabs = await this.commonData.getGDPR();
        this.gdprTabs = gdprTabs;
        this.selectedGdprIndex = 0;
      }

      this.filterWodle(newTab);

      if (newTab !== 'welcome') this.tabHistory.push(newTab);

      if (this.tabHistory.length > 2)
        this.tabHistory = this.tabHistory.slice(-2);

      this.tabVisualizations.setTab(newTab);

      if (this.tab === newTab && !force) return;

      const sameTab =
        ((this.tab === newTab && this.tabHistory.length < 2) ||
          (this.tabHistory.length === 2 &&
            this.tabHistory[0] === this.tabHistory[1])) &&
        force !== 'nav';

      // Restore force value if we come from md-nav action
      if (force === 'nav') force = false;

      this.$location.search('tab', newTab);

      const preserveDiscover =
        this.tabHistory.length === 2 &&
        this.tabHistory[0] === this.tabHistory[1];

      this.tab = newTab;

      await this.switchSubtab('panels', true, sameTab, preserveDiscover);
    } catch (error) {
      this.errorHandler.handle(error, 'Overview');
    }
    if (!this.$scope.$$phase) this.$scope.$digest();
    return;
  }

  startVis2Png() {
    return this.reportingService.startVis2Png(this.tab);
  }

  async getSummary() {
    try {
      const data = await this.apiReq.request('GET', '/agents/summary', {});
      const result =
        data && data.data && data.data.data ? data.data.data : false;
      if (result) {
        const active = result.Active - 1;
        const total = result.Total - 1;
        this.agentsCountActive = active;
        this.agentsCountDisconnected = result.Disconnected;
        this.agentsCountNeverConnected = result['Never connected'];
        this.agentsCountTotal = total;
        this.agentsCoverity = total ? (active / total) * 100 : 0;
      } else {
        throw new Error('Error fetching /agents/summary from Wazuh API');
      }
      return;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async loadConfiguration() {
    try {
      const configuration = this.wazuhConfig.getConfig();

      this.wzMonitoringEnabled = !!configuration['wazuh.monitoring.enabled'];

      return;
    } catch (error) {
      this.wzMonitoringEnabled = true;
      return Promise.reject(error);
    }
  }

  async init() {
    try {
      await this.loadConfiguration();
      await this.switchTab(this.tab, true);
    } catch (error) {
      this.errorHandler.handle(error, 'Overview (init)');
    }
    if (!this.$scope.$$phase) this.$scope.$digest();
    return;
  }
}
