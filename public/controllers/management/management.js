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
  constructor($scope, $location, shareAgent, wazuhConfig) {
    this.$scope = $scope;
    this.$location = $location;
    this.shareAgent = shareAgent;
    this.wazuhConfig = wazuhConfig;
    this.tab = 'welcome';
    this.rulesetTab = 'rules';
    this.globalConfigTab = 'overview'
    this.tabNames = TabNames;
    this.wazuhManagementTabs = ['ruleset', 'groups', 'configuration'];
    this.statusReportsTabs = ['status', 'logs', 'reporting', 'monitoring'];
    this.currentGroup = false;
    this.$scope.$on('setCurrentGroup', (ev, params) => {
      this.currentGroup = (params || {}).currentGroup || false;
    });
    this.$scope.$on('removeCurrentGroup', () => {
      this.currentGroup = false;
    });
    this.$scope.$on('setCurrentRule', (ev, params) => {
      this.currentRule = (params || {}).currentRule || false;
    });
    this.$scope.$on('removeCurrentRule', () => {
      this.currentRule = false;
    });
    this.$scope.$on('setCurrentDecoder', (ev, params) => {
      this.currentDecoder = (params || {}).currentDecoder || false;
    });
    this.$scope.$on('removeCurrentDecoder', () => {
      this.currentDecoder = false;
    });
    this.$scope.$on('setCurrentList', (ev, params) => {
      this.currentList = (params || {}).currentList || false;
    });
    this.$scope.$on('removeCurrentList', () => {
      this.currentList = false;
    });
    this.$scope.$on('setCurrentConfiguration', (ev, params) => {
      this.currentConfiguration = (params || {}).currentConfiguration || false;
    });
    this.$scope.$on('removeCurrentConfiguration', () => {
      this.currentConfiguration = false;
    });
  }

  /**
   * When controller loads
   */
  $onInit() {

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

  setConfigTab(tab) {
    this.globalConfigTab = tab;
    this.$location.search('configSubTab', null);
    this.$scope.$broadcast('configurationIsReloaded', { globalConfigTab: this.globalConfigTab });
  }
  /**
   * This switch to a selected tab
   * @param {String} tab
   */
  switchTab(tab) {
    this.tab = tab;

    if (this.tab === 'groups') {
      this.$scope.$broadcast('groupsIsReloaded');
    }
    if (this.tab === 'configuration') {
      this.globalConfigTab = 'overview'
      this.currentConfiguration = false;
      this.$scope.$broadcast('configurationIsReloaded');
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
  }
}
