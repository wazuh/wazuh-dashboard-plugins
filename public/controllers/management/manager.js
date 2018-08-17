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
import TabNames      from '../../utils/tab-names';

const app = uiModules.get('app/wazuh', []);

app.controller('managerController', function ($scope, $rootScope, $routeParams, $location) {
    $scope.tab  = 'welcome';
    $scope.rulesetTab = 'rules';

    // Tab names
    $scope.tabNames = TabNames;

    if ($routeParams.tab){
        $scope.tab = $routeParams.tab;
    }

    $scope.reloadGroups = () => {
        $scope.tab = 'groups';
        $scope.$broadcast('groupsIsReloaded')
    }

    $scope.reloadRuleset = () => {
        $scope.tab = 'ruleset';
        $scope.$broadcast('rulesetIsReloaded')
    }

    $scope.wazuhManagementTabs = ['ruleset', 'groups', 'configuration'];
    $scope.statusReportsTabs = ['status', 'logs', 'monitoring', 'reporting'];

    $scope.inArray = (item, array) => item && Array.isArray(array) && array.includes(item);

    // Watchers
    $scope.$watch('tab', () => {
        if($scope.tab === 'ruleset') {
            $rootScope.globalRuleSet = 'ruleset';
            $rootScope.globalRulesetTab = $scope.rulesetTab;
        } else {
            delete $rootScope.globalRuleSet;
            delete $rootScope.globalRulesetTab;
        }
        $location.search('tab', $scope.tab);
    });

    $scope.switchTab = tab => {
        $scope.tab = tab;
    }

    $scope.setRulesTab = (tab) => $scope.rulesetTab = tab;

    $scope.$on("$destroy", () => {

    });
});