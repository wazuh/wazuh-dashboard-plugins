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
import { TabNames } from '../../utils/tab-names';

const app = uiModules.get('app/wazuh', []);

class Management {
  constructor($scope, $rootScope, $routeParams, $location) {
    this.$scope = $scope;
    this.$rootScope = $rootScope;
    this.$routeParams = $routeParams;
    this.$location = $location;
    this.tab = 'welcome';
    this.rulesetTab = 'rules';
    this.tabNames = TabNames;
    this.wazuhManagementTabs = ['ruleset', 'groups'];
    this.statusReportsTabs = [
      'status',
      'logs',
      'reporting'
    ];
  }

  $onInit() {
    if (this.$routeParams.tab) {
      this.tab = this.$routeParams.tab;
      this.switchTab(this.tab)
    }
  }

  inArray(item, array) {
    return item && Array.isArray(array) && array.includes(item);
  }

  switchTab(tab) {
    this.tab = tab;
    
    if(this.tab === 'groups') {
      this.$scope.$broadcast('groupsIsReloaded');
    }
    
    if(this.tab === 'ruleset') {
      this.$scope.$broadcast('rulesetIsReloaded');
      this.$rootScope.globalRuleSet = 'ruleset';
      this.$rootScope.globalRulesetTab = this.rulesetTab;
    } else {
      delete this.$rootScope.globalRuleSet;
      delete this.$rootScope.globalRulesetTab;
    }

    this.$location.search('tab', this.tab);
  }

  setRulesTab(tab) {
    this.rulesetTab = tab;
  }

}

app.controller('managementController', Management);
