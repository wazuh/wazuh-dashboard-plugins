/*
 * Wazuh app - Manager controllers
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import * as modules from 'ui/modules'

const app = modules.get('app/wazuh', []);

app.controller('managerController', function ($scope, $rootScope, $routeParams, $location, apiReq, errorHandler) {
    $scope.submenuNavItem  = 'status';
    $scope.submenuNavItem2 = 'rules';

    if ($routeParams.tab){
        $scope.submenuNavItem = $routeParams.tab;
    }

    $scope.reloadGroups = () => {
        $scope.submenuNavItem = 'groups';
        $rootScope.groupsIsReloaded = true;
    }

    $scope.reloadRuleset = () => {
        $scope.submenuNavItem = 'ruleset';
        $rootScope.rulesetIsReloaded = true;
    }

    // Watchers
    $scope.$watch('submenuNavItem', () => {
        if($scope.submenuNavItem === 'ruleset') {
            $rootScope.globalRuleSet = 'ruleset';
            $rootScope.globalsubmenuNavItem2 = $scope.submenuNavItem2;
        } else {
            delete $rootScope.globalRuleSet;
            delete $rootScope.globalsubmenuNavItem2;
        }
        $location.search('tab', $scope.submenuNavItem);
    });

    $scope.setRulesTab = (tab) => $scope.submenuNavItem2 = tab;

    $scope.$on("$destroy", () => {

    });
});

app.controller('managerStatusController', function ($scope,$rootScope, errorHandler, apiReq) {
    //Initialization
    $scope.load  = true;

    //Functions
    $scope.getDaemonStatusClass = daemonStatus => (daemonStatus === 'running') ? 'status teal' : 'status red';

    Promise.all([
        apiReq.request('GET', '/agents/summary', {}),
        apiReq.request('GET', '/manager/status', {}),
        apiReq.request('GET', '/manager/info', {}),
        apiReq.request('GET', '/rules', { offset: 0, limit: 1 }),
        apiReq.request('GET', '/decoders', { offset: 0, limit: 1 })
    ])
    .then(data => {
        const active = data[0].data.data.Active - 1;
        const total  = data[0].data.data.Total - 1;
        $scope.agentsCountActive         = active;
        $scope.agentsCountDisconnected   = data[0].data.data.Disconnected;
        $scope.agentsCountNeverConnected = data[0].data.data['Never connected'];
        $scope.agentsCountTotal          = total;
        $scope.agentsCoverity            = (active / total) * 100;

        $scope.daemons       = data[1].data.data;
        $scope.managerInfo   = data[2].data.data;
        $scope.totalRules    = data[3].data.data.totalItems;
        $scope.totalDecoders = data[4].data.data.totalItems;

        return apiReq.request('GET', '/agents', { limit: 1, sort: '-date_add' });
    })
    .then(lastAgent => apiReq.request('GET', `/agents/${lastAgent.data.data.items[0].id}`, {}))
    .then(agentInfo => {
        $scope.agentInfo = agentInfo.data.data;
        $scope.load = false;
        if(!$scope.$$phase) $scope.$digest();
    })
    .catch(error => {
        errorHandler.handle(error,'Manager');
        if(!$rootScope.$$phase) $rootScope.$digest();
    });

    $scope.$on("$destroy", () => {

    });

});

import beautifier from 'plugins/wazuh/utils/json-beautifier';

app.controller('managerConfigurationController', function ($scope, $rootScope, errorHandler, apiReq) {
    //Initialization
    $scope.load    = true;
    $scope.isArray = angular.isArray;

    $scope.switchItem = item => {
        $scope.selectedItem = item;
        if(!$scope.$$phase) $scope.$digest();
    }

    //Functions
    const load = async () => {
        try{
            const data = await apiReq.request('GET', '/manager/configuration', {});

            $scope.managerConfiguration = data.data.data;

            if($scope.managerConfiguration && $scope.managerConfiguration['active-response']){
                for(let i=0,len = $scope.managerConfiguration['active-response'].length; i<len; i++){
                    let rule = '';
                    const rulesArray = $scope.managerConfiguration['active-response'][i].rules_id ?
                                       $scope.managerConfiguration['active-response'][i].rules_id.split(',') :
                                       [];
                    if($scope.managerConfiguration['active-response'][i].rules_id && rulesArray.length > 1){
                        let tmp = [];
                        for(let id of rulesArray){
                            rule = await apiReq.request('GET',`/rules/${id}`,{});
                            tmp.push(rule.data.data.items[0]);
                        }

                        $scope.managerConfiguration['active-response'][i].rules = tmp;
                    } else if($scope.managerConfiguration['active-response'][i].rules_id){
                        rule = await apiReq.request('GET',`/rules/${$scope.managerConfiguration['active-response'][i].rules_id}`,{});
                        $scope.managerConfiguration['active-response'][i].rule = rule.data.data.items[0];
                    }
                }
            }

            $scope.raw = beautifier.prettyPrint(data.data.data);
            $scope.load                 = false;
            if(!$scope.$$phase) $scope.$digest();
            return;
        } catch (error) {
            errorHandler.handle(error,'Manager');
            if(!$rootScope.$$phase) $rootScope.$digest();
        }
    };

    load();
    $scope.$on("$destroy", () => {

    });
});
