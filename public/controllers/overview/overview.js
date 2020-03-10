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
import { VisFactoryHandler } from '../../react-services/vis-factory-handler';
import { RawVisualizations } from '../../factories/raw-visualizations';
import { getServices } from 'plugins/kibana/discover/kibana_services';

export class OverviewController {
  /**
   * Class constructor
   * @param {*} $scope
   * @param {*} $location
   * @param {*} $rootScope
   * @param {*} appState
   * @param {*} errorHandler
   * @param {*} apiReq
   * @param {*} tabVisualizations
   * @param {*} commonData
   * @param {*} reportingService
   */
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
    this.visFactoryService = VisFactoryHandler;
    this.wazuhConfig = new WazuhConfig();
    this.showingMitreTable = false;
    this.rawVisualizations = new RawVisualizations();
  }

  /**
   * On controller loads
   */
  $onInit() {
    const { filterManager } = getServices();
    this.filterManager = filterManager;
    this.rawVisualizations.setType("");
    this.wodlesConfiguration = false;
    this.TabDescription = TabDescription;
    this.$rootScope.reportStatus = false;

    this.$location.search('_a', null);
    this.filterHandler = new FilterHandler(AppState.getCurrentPattern());
    this.visFactoryService.clearAll();

    const currentApi = JSON.parse(AppState.getCurrentAPI()).id;
    const extensions = AppState.getExtensions(currentApi);
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

    this.welcomeCardsProps = {
      api: AppState.getCurrentAPI(),
      switchTab: tab => this.switchTab(tab),
      extensions: this.extensions,
      setExtensions: (api, extensions) =>
        AppState.setExtensions(api, extensions)
    };

    this.visualizeTopMenuProps = {
      switchDiscover: tab => {
        this.switchSubtab(tab);
      },
      tab: this.tab,
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
      },
      cardReqs: {}
    }

    this.$scope.$on('$destroy', () => {
      this.visFactoryService.clearAll();
    });
  }

  async updateSelectedAgents(agentList){
    this.isAgent = agentList ? agentList[0] : false;
    this.$scope.isAgentText = this.isAgent && agentList.length === 1 ? ` of agent ${agentList.toString()}` : this.isAgent && agentList.length > 1 ? ` of ${agentList.length.toString()} agents` : false;

    if(agentList && agentList.length && this.rawVisualizations.getType() !== 'agents'){
      this.$rootScope.resultState = "Fetching dashboard data...";
      await this.visFactoryService.buildAgentsVisualizations(
        this.filterHandler,
        this.tab,
        null,
        agentList,
        this.tabView === 'discover'
      ); 
    }else if(!agentList && this.rawVisualizations.getType() !== 'general'){
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

  /**
   * This check if given array of items contais a single given item
   * @param {Object} item
   * @param {Array<Object>} array
   */
  inArray(item, array) {
    return item && Array.isArray(array) && array.includes(item);
  }

  /**
   * Show/hide MITRE table
   */
  switchMitreTab() {
    this.showingMitreTable = !this.showingMitreTable
  }

  // Switch subtab
  async switchSubtab(
    subtab
  ) {
    try {
      this.tabVisualizations.clearDeadVis();
      this.visFactoryService.clear();
      this.$location.search('tabView', subtab);

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
    this.visualizeTopMenuProps.subtab = subtab;
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
    this.tabVisualizations.setTab(newTab);
    if (newTab !== 'pci' && newTab !== 'gdpr' && newTab !== 'hipaa' && newTab !== 'nist'){
      this.visualizeProps.cardReqs = {};
    }
    if (newTab === 'pci') {
      this.visualizeProps.cardReqs = { items: await this.commonData.getPCI(), reqTitle: 'PCI DSS Requirement' };
    }
    if (newTab === 'gdpr') {
      this.visualizeProps.cardReqs = { items: await this.commonData.getGDPR(), reqTitle: 'GDPR Requirement' };
    }
    if (newTab === 'hipaa') {
      this.visualizeProps.cardReqs = { items: await this.commonData.getHIPAA(), reqTitle: 'HIPAA Requirement' };
    }
    if (newTab === 'nist') {
      this.visualizeProps.cardReqs = { items: await this.commonData.getNIST(), reqTitle: 'NIST 800-53 Requirement' };
    }
    this.visualizeProps.selectedTab = newTab;
    this.visualizeTopMenuProps.tab = newTab;
    this.showingMitreTable = false;
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

      if (newTab === 'mitre') {
        const result = await this.apiReq.request('GET', '/rules/mitre', {});
        this.$scope.mitreIds = ((((result || {}).data) || {}).data || {}).items

        this.mitreCardsSliderProps = {
          items: this.$scope.mitreIds,
          attacksCount: this.$scope.attacksCount,
          reqTitle: "MITRE",
          wzReq: (method, path, body) => this.apiReq.request(method, path, body),
          addFilter: (id) => this.addMitrefilter(id)
        }

        this.mitreTableProps = {
          wzReq: (method, path, body) => this.apiReq.request(method, path, body),
          attacksCount: this.$scope.attacksCount,
        }
      }

      if (this.tab === newTab && !force) return;

      // Restore force value if we come from md-nav action
      if (force === 'nav') force = false;

      this.$location.search('tab', newTab);
      this.tab = newTab;

      await this.switchSubtab('panels', true);
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

      this.$scope.$on('sendVisDataRows', (ev, param) => {
        const rows = (param || {}).mitreRows.tables[0].rows
        this.$scope.attacksCount = {}
        for (var i in rows) {
          this.$scope.attacksCount[rows[i]["col-0-2"]] = rows[i]["col-1-1"]
        }

        this.mitreTableProps = {
          wzReq: (method, path, body) => this.apiReq.request(method, path, body),
          attacksCount: this.$scope.attacksCount,
        }
        this.mitreCardsSliderProps = {
          items: this.$scope.mitreIds,
          attacksCount: this.$scope.attacksCount,
          reqTitle: "MITRE",
          wzReq: (method, path, body) => this.apiReq.request(method, path, body),
          addFilter: (id) => this.addMitrefilter(id)
        }
      });

    } catch (error) {
      this.errorHandler.handle(error.message || error);
    }
    this.$scope.$applyAsync();
    return;
  }
}
