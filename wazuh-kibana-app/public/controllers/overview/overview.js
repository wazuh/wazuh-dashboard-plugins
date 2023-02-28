/*
 * Wazuh app - Overview controller
 * Copyright (C) 2015-2022 Wazuh, Inc.
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
import { WAZUH_MODULES } from '../../../common/wazuh-modules';

import { AppState } from '../../react-services/app-state';
import { WazuhConfig } from '../../react-services/wazuh-config';
import { WzRequest } from '../../react-services/wz-request';
import { ErrorHandler } from '../../react-services/error-handler';
import { TabVisualizations } from '../../factories/tab-visualizations';
import { updateCurrentTab, updateCurrentAgentData } from '../../redux/actions/appStateActions';
import { VisFactoryHandler } from '../../react-services/vis-factory-handler';
import { RawVisualizations } from '../../factories/raw-visualizations';
import store from '../../redux/store';
import { UI_LOGGER_LEVELS } from '../../../common/constants';
import { getDataPlugin } from '../../kibana-services';
import { UI_ERROR_SEVERITIES } from '../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../react-services/common-services';
import { getSettingDefaultValue } from '../../../common/services/settings';

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
    this.TabDescription = WAZUH_MODULES;
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
      this.updateSelectedAgents([formattedData.id]);
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
    try{
      if (this.initialFilter) {
        this.initialFilter = false;
        this.agentsSelectionProps.initialFilter = false;
      }
      this.isAgent = agentList && agentList.length ? agentList[0] : false;
      this.$scope.isAgentText = this.isAgent && agentList.length === 1 ? ` of agent ${agentList.toString()}` : this.isAgent && agentList.length > 1 ? ` of ${agentList.length.toString()} agents` : false;
      if (agentList && agentList.length) {
          await this.visFactoryService.buildAgentsVisualizations(
            this.filterHandler,
            this.tab,
            this.tabView,
            agentList[0],
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
      };
      setTimeout(() => { this.$location.search('agentId', store.getState().appStateReducers.currentAgentData.id ? String(store.getState().appStateReducers.currentAgentData.id) : null) }, 1);
  
      this.visualizeProps["isAgent"] = agentList ? agentList[0] : false;
      this.$rootScope.$applyAsync();
    }catch(error){
      const options = {
        context: `${OverviewController.name}.updateSelectedAgents`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error,
          message: error.message || error,
          title: error.name || error,
        },
      };
      getErrorOrchestrator().handleError(options);
      throw error;
    }
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
      const options = {
        context: `${OverviewController.name}.switchSubtab`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error,
          message: error.message || error,
          title: error.name || error,
        },
      };

      getErrorOrchestrator().handleError(options);
    }
    this.agentsSelectionProps.subtab = subtab;
    this.$scope.$applyAsync();
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
    const timefilter = getDataPlugin().query.timefilter.timefilter;
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

      if (typeof this.agentsCount === 'undefined') {
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
      const options = {
        context: `${OverviewController.name}.switchTab`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error,
          message: error.message || error,
          title: error.name || error,
        },
      };

      getErrorOrchestrator().handleError(options);
    }
    this.$scope.$applyAsync();
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
      const {data: { data: {connection: data} }} = await WzRequest.apiReq('GET', '/agents/summary/status', {});
      this.agentsCount = data;
      this.welcomeCardsProps.agentsCountTotal = data.total;
      this.agentsCoverity = data.total ? (data.active / data.total) * 100 : 0;
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
    const filter = `{"meta":{ "index": ${AppState.getCurrentPattern() || getSettingDefaultValue('pattern')}},"query":{"match":{"rule.mitre.id":{"query":"${id}","type":"phrase"}}}}`;
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
      const options = {
        context: `${OverviewController.name}.init`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error,
          message: error.message || error,
          title: error.name || error,
        },
      };

      getErrorOrchestrator().handleError(options);
    }
    this.$scope.$applyAsync();
  }
}
