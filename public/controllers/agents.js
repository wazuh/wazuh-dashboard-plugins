/*
 * Wazuh app - Agents controller
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import beautifier    from 'plugins/wazuh/utils/json-beautifier';
import * as modules  from 'ui/modules'
import FilterHandler from '../utils/filter-handler'
import generateMetric from '../utils/generate-metric'
import TabNames       from '../utils/tab-names'
import { metricsAudit, metricsVulnerability, metricsScap, metricsVirustotal } from '../utils/agents-metrics'

const app = modules.get('app/wazuh', []);

app.controller('agentsController', function ($timeout, $scope, $location, $rootScope, appState, genericReq, apiReq, AgentsAutoComplete, errorHandler, rawVisualizations, loadedVisualizations, tabVisualizations, discoverPendingUpdates, visHandlers, vis2png, shareAgent, commonData, reportingService) {

    $rootScope.reportStatus = false;

    $location.search('_a',null)
    const filterHandler = new FilterHandler(appState.getCurrentPattern());
    visHandlers.removeAll();
    discoverPendingUpdates.removeAll();
    rawVisualizations.removeAll();
    tabVisualizations.removeAll();
    loadedVisualizations.removeAll();

    const currentApi  = JSON.parse(appState.getCurrentAPI()).id;
    const extensions  = appState.getExtensions(currentApi);
    $scope.extensions = extensions;
    
    $scope.agentsAutoComplete = AgentsAutoComplete;

    // Check the url hash and retrieve the tabView information
    if ($location.search().tabView){
        $scope.tabView = $location.search().tabView;
    } else { // If tabView doesn't exist, default it to 'panels'
        $scope.tabView = "panels";
        $location.search("tabView", "panels");
    }

    let tabHistory = [];

    // Check the url hash and retrivew the tab information
    if ($location.search().tab){
        $scope.tab = $location.search().tab;
    } else { // If tab doesn't exist, default it to 'welcome'
        $scope.tab = "welcome";
        $location.search("tab", "welcome");
    }

    if($scope.tab !== 'configuration' && $scope.tab !== 'welcome') tabHistory.push($scope.tab);

    // Tab names
    $scope.tabNames = TabNames;

    tabVisualizations.assign('agents');

    const createMetrics = metricsObject => {
        for(let key in metricsObject) {
            $scope[key] = () => generateMetric(metricsObject[key]);
        }
    }

    const checkMetrics = (tab, subtab) => {
        if(subtab === 'panels'){
            switch (tab) {
                case 'audit':
                    createMetrics(metricsAudit);
                    break;
                case 'vuls':
                    createMetrics(metricsVulnerability);
                    break;
                case 'oscap':
                    createMetrics(metricsScap);
                    break;
                case 'virustotal':
                    createMetrics(metricsVirustotal);
                    break;
            }
        }
    }

    // Switch subtab
    $scope.switchSubtab = (subtab, force = false, onlyAgent = false, sameTab = true, preserveDiscover = false) => {
        if($scope.tabView === subtab && !force) return;
        if(!onlyAgent) visHandlers.removeAll();
        discoverPendingUpdates.removeAll();
        rawVisualizations.removeAll();
        loadedVisualizations.removeAll();

        $location.search('tabView', subtab);
        const localChange = ((subtab === 'panels' && $scope.tabView === 'discover') ||
                             (subtab === 'discover' && $scope.tabView === 'panels')) && sameTab;
        if(subtab === 'panels' && $scope.tabView === 'discover' && sameTab){
            $rootScope.$emit('changeTabView',{tabView:$scope.tabView})
        }

        $scope.tabView = subtab;

        if(subtab === 'panels' && $scope.tab !== 'configuration' && $scope.tab !== 'welcome'){
            // Create current tab visualizations
            genericReq.request('GET',`/api/wazuh-elastic/create-vis/agents-${$scope.tab}/${appState.getCurrentPattern()}`)
            .then(data => {
                rawVisualizations.assignItems(data.data.raw);
                commonData.assignFilters(filterHandler, $scope.tab, !changeAgent && localChange || !changeAgent && preserveDiscover, $scope.agent.id)
                changeAgent = false;
                $rootScope.$emit('changeTabView',{tabView:subtab});
                $rootScope.$broadcast('updateVis');
                checkMetrics($scope.tab, 'panels');
            })
            .catch(error => errorHandler.handle(error, 'Agents'));
        } else {
            $rootScope.$emit('changeTabView',{tabView:$scope.tabView})
            checkMetrics($scope.tab, subtab);
        }
    }
    
    let changeAgent = false;

    // Switch tab
    $scope.switchTab = (tab, force = false) => {
        if(tab !== 'configuration' && tab !== 'welcome') tabHistory.push(tab);
        if (tabHistory.length > 2) tabHistory = tabHistory.slice(-2);
        tabVisualizations.setTab(tab);
        if ($scope.tab === tab && !force) return;
        const onlyAgent = $scope.tab === tab && force;
        const sameTab = $scope.tab === tab;
        $location.search('tab', tab);
        const preserveDiscover = tabHistory.length === 2 && tabHistory[0] === tabHistory[1] && !force;
        $scope.tab = tab;
        
        if($scope.tab === 'configuration'){
            firstLoad();
        } else {
            $scope.switchSubtab('panels', true, onlyAgent, sameTab, preserveDiscover);
        }
    };

    // Agent data
    $scope.getAgentStatusClass = agentStatus => agentStatus === "Active" ? "teal" : "red";

    $scope.formatAgentStatus = agentStatus => {
        return ['Active','Disconnected'].includes(agentStatus) ? agentStatus : 'Never connected';
    };

    const validateRootCheck = () => {
        const result = commonData.validateRange($scope.agent.rootcheck)
        $scope.agent.rootcheck = result;
    }

    const validateSysCheck = () => {
        const result = commonData.validateRange($scope.agent.syscheck)
        $scope.agent.syscheck = result;
    }

    $scope.getAgent = async (newAgentId,fromAutocomplete) => {
        try {
            changeAgent = true;
            const globalAgent = shareAgent.getAgent()
            if($scope.tab === 'configuration'){
                return $scope.getAgentConfig(newAgentId);
            }

            let id = null;

            // They passed an id
            if (newAgentId) {
                id = newAgentId;
                $location.search('agent', id);
            } else {
                if ($location.search().agent && !globalAgent) { // There's one in the url
                    id = $location.search().agent;
                } else {
                    id = globalAgent.id;
                    shareAgent.deleteAgent();
                    $location.search('agent', id);
                }
            }

            const data = await Promise.all([
                apiReq.request('GET', `/agents/${id}`, {}),
                apiReq.request('GET', `/syscheck/${id}/last_scan`, {}),
                apiReq.request('GET', `/rootcheck/${id}/last_scan`, {})
            ]);

            // Agent
            $scope.agent = data[0].data.data;
            if ($scope.agent.os) {
                $scope.agentOS = $scope.agent.os.name + ' ' + $scope.agent.os.version;
            }
            else { $scope.agentOS = 'Unknown' };

            // Syscheck
            $scope.agent.syscheck = data[1].data.data;
            validateSysCheck();

            // Rootcheck
            $scope.agent.rootcheck = data[2].data.data;
            validateRootCheck();
            
            $scope.switchTab($scope.tab, true);

            if(!$scope.$$phase) $scope.$digest();
            return;
        } catch (error) {
            errorHandler.handle(error,'Agents');
        }
        return;
    };

    $scope.goGroups = agent => {
        $scope.agentsAutoComplete.reset();
        visHandlers.removeAll();
        //$location.search('_a',null);
        shareAgent.setAgent(agent)
        $location.search('tab', 'groups');
        $location.path('/manager');
    };

    $scope.analyzeAgents = async search => {
        try {
            await $timeout(200);
            $scope.agentsAutoComplete.filters = [];
            await $scope.agentsAutoComplete.addFilter('search',search);

            if(!$scope.$$phase) $scope.$digest();
            return $scope.agentsAutoComplete.items;
        } catch (error) {
            errorHandler.handle(error,'Agents');
        }
        return;
    }


    //Destroy
    $scope.$on("$destroy", () => {
        discoverPendingUpdates.removeAll();
        rawVisualizations.removeAll();
        tabVisualizations.removeAll();
        loadedVisualizations.removeAll();
        $scope.agentsAutoComplete.reset();
        visHandlers.removeAll();
    });

    // PCI and GDPR requirements
    Promise.all([commonData.getPCI(),commonData.getGDPR()])
    .then(data => {
        $scope.pciTabs           = data[0];
        $scope.selectedPciIndex  = 0;
        $scope.gdprTabs          = data[1];
        $scope.selectedGdprIndex = 0;
    })
    .catch(error => errorHandler.handle(error,'Agents'));

    $scope.isArray = angular.isArray;

    const getAgent = newAgentId => {

        // They passed an id
        if (newAgentId) {
            $location.search('agent', newAgentId);
        }

    };

    $scope.getAgentConfig = newAgentId => {
        getAgent(newAgentId);
        firstLoad();
    }

    $scope.goGroup = () => {
        shareAgent.setAgent($scope.agent)
        $location.path('/manager/groups');
    };

    const firstLoad = async () => {
        try{
            const globalAgent = shareAgent.getAgent();
            $scope.configurationError = false;
            $scope.load = true;
            let id;
            if ($location.search().agent && !globalAgent) { // There's one in the url
                id = $location.search().agent;
            } else {
                id = globalAgent.id;
                shareAgent.deleteAgent();
                $location.search('agent', id);
            }

            let data         = await apiReq.request('GET', `/agents/${id}`, {});
            $scope.agent     = data.data.data;
            $scope.groupName = $scope.agent.group;

            if(!$scope.groupName){

                $scope.configurationError = true;
                $scope.load = false;
                if(!$scope.$$phase) $scope.$digest();
                return;
            }

            data                      = await apiReq.request('GET', `/agents/groups/${$scope.groupName}/configuration`, {});
            $scope.groupConfiguration = data.data.data.items[0];
            $scope.rawJSON            = beautifier.prettyPrint(data.data.data.items);

            data = await Promise.all([
                apiReq.request('GET', `/agents/groups?search=${$scope.groupName}`, {}),
                apiReq.request('GET', `/agents/groups/${$scope.groupName}`, {})
            ]);


            let filtered          = data[0].data.data.items.filter(item => item.name === $scope.groupName);
            $scope.groupMergedSum = (filtered.length) ? filtered[0].merged_sum : 'Unknown';

            filtered              = data[1].data.data.items.filter(item => item.id === $scope.agent.id);
            $scope.agentMergedSum = (filtered.length) ? filtered[0].merged_sum : 'Unknown';
            $scope.isSynchronized = (($scope.agentMergedSum === $scope.groupMergedSum) && !([$scope.agentMergedSum,$scope.groupMergedSum].includes('Unknown')) ) ? true : false;

            $scope.load = false;

            if($scope.tab !== 'configuration') $scope.switchTab($scope.tab, true);

            if(!$scope.$$phase) $scope.$digest();
            return;
        } catch (error){
            errorHandler.handle(error,'Agents');
        }
        return;
    }
    /** End of agent configuration */

    $scope.startVis2Png = () => reportingService.startVis2Png($scope.tab, true);

    //Load
    try {
        $scope.getAgent();
        $scope.agentsAutoComplete.nextPage('');
    } catch (e) {
        errorHandler.handle('Unexpected exception loading controller','Agents');
    }

});
