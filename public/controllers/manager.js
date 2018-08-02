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
import { uiModules } from 'ui/modules';
import beautifier    from '../utils/json-beautifier';
import TabNames      from '../utils/tab-names';
import js2xmlparser  from 'js2xmlparser';
import XMLBeautifier from '../utils/xml-beautifier';

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

app.controller('managerStatusController', function ($scope, errorHandler, apiReq) {
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
        // Once Wazuh core fixes agent 000 issues, this should be adjusted
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

        return apiReq.request('GET', '/agents', { limit: 1, sort: '-dateAdd' });
    })
    .then(lastAgent => apiReq.request('GET', `/agents/${lastAgent.data.data.items[0].id}`, {}))
    .then(agentInfo => {
        $scope.agentInfo = agentInfo.data.data;
        $scope.load = false;
        if(!$scope.$$phase) $scope.$digest();
    })
    .catch(error => errorHandler.handle(error,'Manager'));

    $scope.$on("$destroy", () => {

    });

});

app.controller('managerConfigurationController', function ($scope, errorHandler, apiReq) {
    //Initialization
    $scope.load    = true;
    $scope.isArray = Array.isArray;

    $scope.switchItem = item => {
        $scope.XMLContent   = false;
        $scope.JSONContent  = false;
        $scope.selectedItem = item;
        if(!$scope.$$phase) $scope.$digest();
    }

    $scope.getXML = name => {
        $scope.JSONContent = false;
        if($scope.XMLContent){
            $scope.XMLContent = false;
        } else {
            try {
                $scope.XMLContent = XMLBeautifier(js2xmlparser.parse(name,configRaw[name]));
            } catch (error) { $scope.XMLContent = false; }
        }        
        if(!$scope.$$phase) $scope.$digest();
    }

    $scope.getJSON = name => {
        $scope.XMLContent = false;
        if($scope.JSONContent){
            $scope.JSONContent = false;
        } else {
            try {
                $scope.JSONContent = beautifier.prettyPrint(configRaw[name]);
            } catch (error) { $scope.JSONContent = false; }
        }
        if(!$scope.$$phase) $scope.$digest();
    }
    const configRaw = {};
    //Functions
    const load = async () => {
        try{
            const data = await apiReq.request('GET', '/manager/configuration', {});
            Object.assign(configRaw,angular.copy(data.data.data))
            $scope.managerConfiguration = data.data.data;

            if($scope.managerConfiguration && $scope.managerConfiguration['active-response']){

                for(const ar of $scope.managerConfiguration['active-response']) {
                    const rulesArray = ar.rules_id ?
                    ar.rules_id.split(',') :
                                       [];
                    if(ar.rules_id && rulesArray.length > 1){
                        const tmp = [];

                        for(const id of rulesArray){
                            const rule = await apiReq.request('GET',`/rules/${id}`,{});
                            tmp.push(rule.data.data.items[0]);
                        }

                        ar.rules = tmp;
                    } else if(ar.rules_id){
                        const rule = await apiReq.request('GET',`/rules/${ar.rules_id}`,{});
                        ar.rule = rule.data.data.items[0];
                    }
                }
            }

            $scope.raw  = beautifier.prettyPrint(data.data.data);
            $scope.load = false;
            if(!$scope.$$phase) $scope.$digest();
            return;
        } catch (error) {
            errorHandler.handle(error,'Manager');
        }
        return;
    };

    load();
    $scope.$on("$destroy", () => {

    });
});
