/*
 * Wazuh app - Overview controller
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { FilterHandler } from '../../utils/filter-handler';
import { TabNames } from '../../utils/tab-names';
import { TabDescription } from '../../../server/reporting/tab-description';

import { timefilter } from 'ui/timefilter';
import { AppState } from '../../react-services/app-state';
import { WazuhConfig } from '../../react-services/wazuh-config';
import { WzRequest } from '../../react-services/wz-request';
import { ErrorHandler } from '../../react-services/error-handler';
import { TabVisualizations } from '../../factories/tab-visualizations';
import { updateCurrentTab, updateCurrentAgentData } from '../../redux/actions/appStateActions';
import { VisFactoryHandler } from '../../react-services/vis-factory-handler';
import { RawVisualizations } from '../../factories/raw-visualizations';
import store from '../../redux/store';
import { WAZUH_ALERTS_PATTERN } from '../../../util/constants';

export class OverviewController {
  /**
   * Class constructor
   * @param {*} $scope
   * @param {*} $location
   * @param {*} $rootScope
   * @param {*} errorHandler
   * @param {*} commonData
   * @param {*} reportingService
   * @param {*} visFactoryService
   */
  constructor(
    $scope,
    $location,
    $rootScope,
    errorHandler,
    commonData,
    reportingService,
    visFactoryService,
    $route
  ) {
    this.$scope = $scope;
    this.$route = $route;
    this.$location = $location;
    this.$rootScope = $rootScope;
    this.errorHandler = errorHandler;
    this.tabVisualizations = new TabVisualizations();
    this.commonData = commonData;
    this.reportingService = reportingService;
    this.visFactoryService = visFactoryService;
    this.wazuhConfig = new WazuhConfig();
    this.visFactoryService = VisFactoryHandler;
    this.rawVisualizations = new RawVisualizations();
    this.wzReq = (...args) => WzRequest.apiReq(...args);
  }

  /**
   * On controller loads
   */
  async $onInit() {
    this.rawVisualizations.setType("");
    this.wodlesConfiguration = false;
    this.TabDescription = TabDescription;
    this.$rootScope.reportStatus = false;

    this.$location.search('_a', null);
    this.filterHandler = new FilterHandler(AppState.getCurrentPattern());
    this.visFactoryService.clearAll();

    const currentApi = JSON.parse(AppState.getCurrentAPI()).id;
    const extensions = await AppState.getExtensions(currentApi);
    this.extensions = extensions;

    this.wzMonitoringEnabled = false;

    // Tab names
    this.tabNames = TabNames;

    this.tabView = this.commonData.checkTabViewLocation();
    this.tab = this.commonData.checkTabLocation();

    // This object represents the number of visualizations per tab; used to show a progress bar
    this.tabVisualizations.assign('overview');

    this.wodlesConfiguration = null;

    this.init();

    this.$scope.getMainProps = (resultState) => {
      return {
        section: this.tab,
        disabledReport: resultState !== 'ready',
        agentsSelectionProps: this.agentsSelectionProps,
        switchSubTab: (subtab) => this.switchSubtab(subtab)
      }
    }

    this.welcomeCardsProps = {
      api: AppState.getCurrentAPI(),
      switchTab: tab => this.switchTab(tab),
      extensions: this.extensions,
    };

    this.currentOverviewSectionProps = {
      switchTab: (tab, force) => this.switchTab(tab, force),
      currentTab: this.tab
    };



    this.agentsSelectionProps = {
      tab: this.tab,
      initialFilter: this.initialFilter,
      subtab: this.subtab,
      setAgent: async agentList => {
        this.updateSelectedAgents(agentList)
      },
    };

    this.visualizeProps = {
      selectedTab: this.tab,
      isAgent: this.isAgent,
      updateRootScope: (prop, value) => {
        this.$rootScope[prop] = value;
        this.$rootScope.$applyAsync();
      }
    }


    this.$scope.$on('$destroy', () => {
      this.visFactoryService.clearAll();
    });

    this.$scope.getVisualizeProps = (resultState) => {
      return { ...this.visualizeProps, resultState };
    }

    //check if we need to load an agent filter
    const agent = this.$location.search().agentId;
    if (agent && store.getState().appStateReducers.currentAgentData.id !== agent) {
      const params = { "q": `id=${agent}` }
      const data = await this.wzReq('GET', '/agents', { params });
      const agentList = data.data.data.affected_items;
      const formattedData = agentList[0];
      this.visualizeProps["isAgent"] = agent;
      store.dispatch(updateCurrentAgentData(formattedData));
      this.$location.search('agentId', String(agent));
      this.updateSelectedAgents(agentList);
    }
  }

  /**
   * This check if given array of items contais a single given item
   * @param {Object} item
   * @param {Array<Object>} array
   */
  inArray(item, array) {
    return item && Array.isArray(array) && array.includes(item);
  }

  async updateSelectedAgents(agentList) {
    if (this.initialFilter) {
      this.initialFilter = false;
      this.agentsSelectionProps.initialFilter = false;
    }
    this.isAgent = agentList ? agentList[0] : false;
    this.$scope.isAgentText = this.isAgent && agentList.length === 1 ? ` of agent ${agentList.toString()}` : this.isAgent && agentList.length > 1 ? ` of ${agentList.length.toString()} agents` : false;
    if (agentList && agentList.length) {
      await this.visFactoryService.buildAgentsVisualizations(
        this.filterHandler,
        this.tab,
        this.tabView,
        false,
        (this.tabView === 'discover' || this.oldFilteredTab === this.tab)
      );
      this.oldFilteredTab = this.tab;
    } else if (!agentList && this.tab !== 'welcome') {
      if (!store.getState().appStateReducers.currentAgentData.id) {
        await this.visFactoryService.buildOverviewVisualizations(
          this.filterHandler,
          this.tab,
          this.tabView,
          (this.tabView === 'discover' || this.oldFilteredTab === this.tab)
        );
        this.oldFilteredTab = this.tab;
      }
    }
    setTimeout(() => { this.$location.search('agentId', store.getState().appStateReducers.currentAgentData.id ? String(store.getState().appStateReducers.currentAgentData.id) : null) }, 1);

    this.visualizeProps["isAgent"] = agentList ? agentList[0] : false;
    this.$rootScope.$applyAsync();

  }

  // Switch subtab
  async switchSubtab(subtab) {
    try {
      this.oldFilteredTab = "";
      this.tabVisualizations.clearDeadVis();
      this.$location.search('tabView', subtab);
      const previousTab = this.currentOverviewSectionProps.currentTab;

      this.currentOverviewSectionProps = {
        tabView: subtab,
        currentTab: this.tab,
        switchTab: (tab, force) => this.switchTab(tab, force)
      };

      this.tabView = this.commonData.checkTabViewLocation();
      if (this.tab !== 'welcome') {
        this.$rootScope.$emit('changeTabView', { tabView: subtab, tab: this.tab });
      } else {
        this.$scope.$emit('changeTabView', { tabView: subtab, tab: this.tab });
      }
      this.tabView = subtab;
    } catch (error) {
      ErrorHandler.handle(error.message || error);
    }
    this.agentsSelectionProps.subtab = subtab;
    this.$scope.$applyAsync();
    return;
  }

  /**
   * Calculate woodle depending on given tab
   * @param {*} tab
   */
  calculateWodleTagFromTab(tab) {
    if (tab === 'aws') return 'aws-s3';
    return false;
  }

  // Switch tab
  async switchTab(newTab, force = false) {
    this.overviewModuleReady = false;
    this.visFactoryService.clear();
    this.tabVisualizations.setTab(newTab);
    this.agentsSelectionProps.tab = newTab;
    this.visualizeProps.selectedTab = newTab;
    this.$rootScope.rendered = false;
    this.$rootScope.$applyAsync();
    this.expandedVis = false;
    try {
      if (newTab === 'welcome') {
        this.commonData.setRefreshInterval(timefilter.getRefreshInterval());
        timefilter.setRefreshInterval({ pause: true, value: 0 });
      } else if (this.tab === 'welcome') {
        timefilter.setRefreshInterval(this.commonData.getRefreshInterval());
      }

      if (typeof this.agentsCountTotal === 'undefined') {
        await this.getSummary();
      }



      if (this.tab === newTab && !force) return;

      // Restore force value if we come from md-nav action
      if (force === 'nav') force = false;
      this.$location.search('tab', newTab);
      this.tab = newTab;
      if (!this.initialFilter) this.updateSelectedAgents(false);
      const tabView = this.$location.search().tabView;
      if (tabView) {
        await this.switchSubtab(tabView, true);
      } else {
        await this.switchSubtab('panels', true);
      }
      this.overviewModuleReady = true;
    } catch (error) {
      ErrorHandler.handle(error.message || error);
    }
    this.$scope.$applyAsync();
    return;
  }

  /**
   * Transform a visualization into an image
   */
  startVis2Png() {
    return this.reportingService.startVis2Png(this.tab);
  }

  /**
   * This fetch de agents summary
   */
  async getSummary() {
    try {
      const data = await WzRequest.apiReq('GET', '/agents/summary/status', {});

      const result = ((data || {}).data || {}).data || false;

      if (result) {
        const active = result.active;
        const total = result.total;
        this.agentsCountActive = active;
        this.agentsCountDisconnected = result.disconnected;
        this.agentsCountNeverConnected = result['never_connected'];
        this.agentsCountTotal = total;
        this.welcomeCardsProps.agentsCountTotal = total;
        this.agentsCoverity = total ? (active / total) * 100 : 0;
      } else {
        throw new Error('Error fetching /agents/summary from Wazuh API');
      }
      return;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * This load the configuration settings
   */
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

  /**
   * Filter by Mitre.ID
   * @param {*} id
   */
  addMitrefilter(id) {
    const filter = `{"meta":{ "index": ${AppState.getCurrentPattern() || WAZUH_ALERTS_PATTERN}},"query":{"match":{"rule.mitre.id":{"query":"${id}","type":"phrase"}}}}`;
    this.$rootScope.$emit('addNewKibanaFilter', { filter: JSON.parse(filter) });
  }

  /**
   * On controller loads
   */
  async init() {
    try {
      await this.loadConfiguration();
      await this.switchTab(this.tab, true);
      store.dispatch(updateCurrentTab(this.tab));

      this.$scope.$on('sendVisDataRows', (ev, param) => {
        const rows = (param || {}).mitreRows.tables[0].rows;
        this.$scope.attacksCount = {};
        for (var i in rows) {
          this.$scope.attacksCount[rows[i]['col-0-2']] = rows[i]['col-1-1'];
        }

      });
    } catch (error) {
      ErrorHandler.handle(error.message || error);
    }
    this.$scope.$applyAsync();
    return;
  }
}
