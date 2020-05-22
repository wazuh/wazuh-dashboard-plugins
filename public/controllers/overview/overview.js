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
import { ApiRequest } from '../../react-services/api-request';
import { TabVisualizations } from '../../factories/tab-visualizations';
import { updateCurrentTab } from '../../redux/actions/appStateActions';
import { VisFactoryHandler } from '../../react-services/vis-factory-handler';
import { RawVisualizations } from '../../factories/raw-visualizations';
import store from '../../redux/store';

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
    visFactoryService
  ) {
    this.$scope = $scope;
    this.$location = $location;
    this.$rootScope = $rootScope;
    this.errorHandler = errorHandler;
    this.apiReq = ApiRequest;
    this.tabVisualizations = new TabVisualizations();
    this.commonData = commonData;
    this.reportingService = reportingService;
    this.visFactoryService = visFactoryService;
    this.wazuhConfig = new WazuhConfig();
    this.visFactoryService = VisFactoryHandler;
    this.rawVisualizations = new RawVisualizations();
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
      extensions: this.extensions
    };

    this.currentOverviewSectionProps = {
      switchTab: (tab, force) => this.switchTab(tab, force),
      currentTab: this.tab
    };

    //check if we need to load an agent filter
    const agent = this.$location.search().agentId;
    if(agent){
      this.$location.search('agentId', null);
      this.initialFilter = agent;
    }


    this.agentsSelectionProps = {
      switchDiscover: tab => {
        this.switchSubtab(tab);
      },
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

    this.$scope.getVisualizeProps = (resultState) =>{
      return {...this.visualizeProps, resultState};
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

  async updateSelectedAgents(agentList){
    if(this.initialFilter){
      this.initialFilter= false;
      this.agentsSelectionProps.initialFilter = false;
    }
    this.isAgent = agentList ? agentList[0] : false;
    this.$scope.isAgentText = this.isAgent && agentList.length === 1 ? ` of agent ${agentList.toString()}` : this.isAgent && agentList.length > 1 ? ` of ${agentList.length.toString()} agents` : false;

    if(agentList && agentList.length ){ // && this.rawVisualizations.getType() !== 'agents'){
      this.$rootScope.resultState = "Fetching dashboard data...";
      await this.visFactoryService.buildAgentsVisualizations(
        this.filterHandler,
        this.tab,
        null,
        false,
        this.tabView === 'discover'
      ); 
    }else if(!agentList && this.tab !== 'welcome'){ //&& this.rawVisualizations.getType() !== 'general'){ // this.tab !== 'welcome' prevents to load visualization in Overview welcome
      this.$rootScope.resultState = "Fetching dashboard data...";
      await this.visFactoryService.buildOverviewVisualizations(
        this.filterHandler,
        this.tab,
        null, //not needed
        this.tabView === 'discover'
      );
    }
    this.visualizeProps["isAgent"] = agentList; //update dashboard visualizations depending if its an agent or not
    this.$rootScope.$emit('changeTabView', { tabView: this.tabView, tab: this.tab });

  }

  // Switch subtab
  async switchSubtab(subtab) {
    try {
      this.tabVisualizations.clearDeadVis();
      this.$location.search('tabView', subtab);
      const previousTab = this.currentOverviewSectionProps.currentTab;

      this.currentOverviewSectionProps = {
        tabView: subtab,
        currentTab: this.tab,
        switchTab: (tab, force) => this.switchTab(tab, force)
      };

      this.tabView = this.commonData.checkTabViewLocation();
      if (subtab === 'panels' && this.tab !== 'welcome') {
        await this.visFactoryService.buildOverviewVisualizations(
          this.filterHandler,
          this.tab,
          subtab,
          this.tabView === 'discover'
        );
         this.$rootScope.$emit('changeTabView', { tabView: subtab, tab:this.tab });
      } else {
        this.$scope.$emit('changeTabView', {
          tabView: subtab,
          tab: this.tab
        });
      }
      this.tabView = subtab;
    } catch (error) {
      this.errorHandler.handle(error.message || error);
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
      if(!this.initialFilter) this.updateSelectedAgents(false);
      await this.switchSubtab('panels', true);
      this.overviewModuleReady = true;
    } catch (error) {
      this.errorHandler.handle(error.message || error);
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
      const data = await this.apiReq.request('GET', '/agents/summary', {});

      const result = ((data || {}).data || {}).data || false;

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
    const filter = `{"meta":{"index":"wazuh-alerts-3.x-*"},"query":{"match":{"rule.mitre.id":{"query":"${id}","type":"phrase"}}}}`;
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
      store.dispatch(updateCurrentTab(this.tab));

      this.$scope.$on('sendVisDataRows', (ev, param) => {
        const rows = (param || {}).mitreRows.tables[0].rows;
        this.$scope.attacksCount = {};
        for (var i in rows) {
          this.$scope.attacksCount[rows[i]['col-0-2']] = rows[i]['col-1-1'];
        }

      });
    } catch (error) {
      this.errorHandler.handle(error.message || error);
    }
    this.$scope.$applyAsync();
    return;
  }
}
