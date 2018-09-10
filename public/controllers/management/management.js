/*
 * Wazuh app - Management controller
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { uiModules } from 'ui/modules';
import TabNames from '../../utils/tab-names';

const app = uiModules.get('app/wazuh', []);

class Management {
  constructor($scope, $rootScope, $routeParams, $location) {
    this.$scope = $scope;
    this.$rootScope = $rootScope;
    this.$routeParams = $routeParams;
    this.$location = $location;
    this.$scope.tab = 'welcome';
    this.$scope.rulesetTab = 'rules';
    this.$scope.tabNames = TabNames;

    this.$scope.wazuhManagementTabs = ['ruleset', 'groups', 'configuration'];
    this.$scope.statusReportsTabs = [
      'status',
      'logs',
      'monitoring',
      'reporting'
    ];
  }

  $onInit() {
    if (this.$routeParams.tab) {
      this.$scope.tab = this.$routeParams.tab;
    }

    this.$scope.reloadGroups = () => this.reloadGroups();
    this.$scope.reloadRuleset = () => this.reloadRuleset();

    this.$scope.inArray = (item, array) => this.inArray(item, array);

    this.$scope.switchTab = tab => this.switchTab(tab);
    this.$scope.setRulesTab = tab => this.setRulesTab(tab);

    this.$scope.$watch('tab', () => this.watchTab());
  }

  reloadGroups() {
    this.$scope.tab = 'groups';
    this.$scope.$broadcast('groupsIsReloaded');
  }

  reloadRuleset() {
    this.$scope.tab = 'ruleset';
    this.$scope.$broadcast('rulesetIsReloaded');
  }

  inArray(item, array) {
    return item && Array.isArray(array) && array.includes(item);
  }

  switchTab(tab) {
    this.$scope.tab = tab;
  }

  setRulesTab(tab) {
    this.$scope.rulesetTab = tab;
  }

  watchTab() {
    if (this.$scope.tab === 'ruleset') {
      this.$rootScope.globalRuleSet = 'ruleset';
      this.$rootScope.globalRulesetTab = this.$scope.rulesetTab;
    } else {
      delete this.$rootScope.globalRuleSet;
      delete this.$rootScope.globalRulesetTab;
    }
    this.$location.search('tab', this.$scope.tab);
  }
}

app.controller('managementController', Management);
