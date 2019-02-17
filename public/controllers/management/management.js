/*
 * Wazuh app - Management controller
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { TabNames } from '../../utils/tab-names';

export class ManagementController {
  /**
   * Class constructor
   * @param {*} $scope
   * @param {*} $location
   * @param {*} shareAgent
   */
  constructor(
    $scope,
    $rootScope,
    $location,
    shareAgent,
    wazuhConfig,
    appState,
    configHandler,
    errorHandler
  ) {
    this.$scope = $scope;
    this.$rootScope = $rootScope;
    this.$location = $location;
    this.appState = appState;
    this.shareAgent = shareAgent;
    this.wazuhConfig = wazuhConfig;
    this.configHandler = configHandler;
    this.errorHandler = errorHandler;
    this.tab = 'welcome';
    this.rulesetTab = 'rules';
    this.globalConfigTab = 'overview';
    this.tabNames = TabNames;
    this.wazuhManagementTabs = ['ruleset', 'groups', 'configuration'];
    this.statusReportsTabs = ['status', 'logs', 'reporting', 'monitoring'];
    this.currentGroup = false;
    this.$scope.$on('setCurrentGroup', (ev, params) => {
      this.currentGroup = (params || {}).currentGroup || false;
    });
    this.$scope.$on('removeCurrentGroup', () => {
      this.currentGroup = false;
      this.appState.setNavigation({ status: true });
    });
    this.$scope.$on('setCurrentRule', (ev, params) => {
      this.currentRule = (params || {}).currentRule || false;
      this.$location.search('currentRule', true);
      this.appState.setNavigation({ status: true });
    });
    this.$scope.$on('removeCurrentRule', () => {
      this.currentRule = false;
      this.appState.setNavigation({ status: true });
      this.$location.search('currentRule', null);
    });
    this.$scope.$on('setCurrentDecoder', (ev, params) => {
      this.currentDecoder = (params || {}).currentDecoder || false;
      this.$location.search('currentDecoder', true);
      this.appState.setNavigation({ status: true });
    });
    this.$scope.$on('removeCurrentDecoder', () => {
      this.currentDecoder = false;
      this.appState.setNavigation({ status: true });
      this.$location.search('currentDecoder', null);
    });
    this.$scope.$on('setCurrentList', (ev, params) => {
      this.currentList = (params || {}).currentList || false;
      this.$location.search('currentList', true);
      this.appState.setNavigation({ status: true });
      if (!this.$scope.$$phase) this.$scope.$digest();
    });
    this.$scope.$on('removeCurrentList', () => {
      this.currentList = false;
      this.appState.setNavigation({ status: true });
      this.$location.search('currentList', null);
    });
    this.$scope.$on('setCurrentConfiguration', (ev, params) => {
      this.currentConfiguration = (params || {}).currentConfiguration || false;
    });
    this.$scope.$on('removeCurrentConfiguration', () => {
      this.currentConfiguration = false;
    });
    this.$rootScope.$on('setRestarting', () => {
      this.isRestarting = true;
      this.$scope.$applyAsync();
    });
    this.$rootScope.$on('removeRestarting', () => {
      this.isRestarting = false;
      this.$scope.$applyAsync();
    });
    this.appState = appState;
  }

  /**
   * When controller loads
   */
  $onInit() {
    this.clusterInfo = this.appState.getClusterInfo();
    const configuration = this.wazuhConfig.getConfig();
    this.$scope.adminMode = !!(configuration || {}).admin;
    if (this.shareAgent.getAgent() && this.shareAgent.getSelectedGroup()) {
      this.tab = 'groups';
      this.switchTab(this.tab);
      return;
    }
    const location = this.$location.search();
    if (location && location.tab) {
      this.tab = location.tab;
      this.switchTab(this.tab);
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

  async restartManager() {
    try {
      this.isRestarting = true;
      const data = await this.configHandler.restartManager();
      this.isRestarting = false;
      this.errorHandler.info(data.data.data, '');
      this.$scope.$applyAsync();
    } catch (error) {
      this.isRestarting = false;
      this.$scope.$applyAsync();
      this.errorHandler.handle(
        error.message || error,
        'Error restarting manager'
      );
    }
  }
  async restartCluster() {
    try {
      this.isRestarting = true;
      const data = await this.configHandler.restartCluster();
      this.isRestarting = false;
      this.errorHandler.info('It may take a few seconds...', data.data.data);
      this.$scope.$applyAsync();
    } catch (error) {
      this.isRestarting = false;
      this.$scope.$applyAsync();
      this.errorHandler.handle(
        error.message || error,
        'Error restarting cluster'
      );
    }
  }

  setConfigTab(tab, nav = false) {
    this.globalConfigTab = tab;
    if (nav) {
      this.appState.setNavigation({ status: true });
    } else {
      this.$scope.editionTab = tab;
      this.$rootScope.$broadcast('configurationIsReloaded', {
        globalConfigTab: this.globalConfigTab,
        reloadConfigSubTab: true
      });
    }
    this.$location.search('configSubTab', null);
    this.$location.search('editSubTab', tab);
    this.$scope.$broadcast('configurationIsReloaded', {
      globalConfigTab: this.globalConfigTab,
      reloadConfigSubTab: true
    });
  }
  /**
   * This switch to a selected tab
   * @param {String} tab
   */
  switchTab(tab, setNav = false) {
    this.editTab = '';
    if (setNav) {
      this.appState.setNavigation({ status: true });
    } else {
      if (this.$location.search().editSubTab) {
        this.editTab = this.$location.search().editSubTab;
      }
    }
    this.$location.search('editSubTab', null);
    this.tab = tab;

    if (this.tab === 'groups') {
      this.$scope.$broadcast('groupsIsReloaded');
    }
    if (this.tab === 'configuration' && !this.editTab) {
      this.globalConfigTab = 'overview';
      this.currentConfiguration = false;
      this.$scope.$broadcast('configurationIsReloaded');
    } else if (this.tab === 'configuration' && this.editTab) {
      this.setConfigTab(this.editTab);
    } else {
      this.$location.search('configSubTab', null);
    }
    if (this.tab === 'ruleset') {
      this.$scope.$broadcast('rulesetIsReloaded');
      this.globalRuleSet = 'ruleset';
      this.globalRulesetTab = this.rulesetTab;
    } else {
      this.globalRuleSet = false;
      this.globalRulesetTab = false;
      this.currentRule = false;
      this.currentDecoder = false;
      this.currentList = false;
    }

    this.$location.search('tab', this.tab);
  }

  /**
   * This set the rules tab
   * @param {String} tab
   */
  setRulesTab(tab) {
    this.rulesetTab = tab;
    this.globalRulesetTab = this.rulesetTab;
    this.breadCrumbBack();
  }

  breadCrumbBack(goRoot = false) {
    if (this.currentRule) {
      this.$scope.$broadcast('closeRuleView');
    } else if (this.currentDecoder) {
      this.$scope.$broadcast('closeDecoderView');
    } else if (this.currentList) {
      this.$scope.$broadcast('closeListView');
    }
    if (goRoot) {
      this.switchTab('ruleset', true);
      this.setRulesTab('rules');
    }
  }
}
