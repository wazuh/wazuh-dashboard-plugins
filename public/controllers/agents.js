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
import beautifier    from '../utils/json-beautifier';
import { uiModules } from 'ui/modules'
import FilterHandler from '../utils/filter-handler'
import generateMetric from '../utils/generate-metric'
import TabNames       from '../utils/tab-names'
import { metricsAudit, metricsVulnerability, metricsScap, metricsCiscat, metricsVirustotal } from '../utils/agents-metrics'
import * as FileSaver from '../services/file-saver'

const app = uiModules.get('app/wazuh', []);

app.controller('agentsController',

function (
    $timeout, $scope, $location, $rootScope,
    appState, apiReq, AgentsAutoComplete, errorHandler,
    tabVisualizations, vis2png, shareAgent, commonData,
    reportingService, visFactoryService, csvReq,
    wzTableFilter
) {

    $rootScope.reportStatus = false;

    $location.search('_a',null)
    const filterHandler = new FilterHandler(appState.getCurrentPattern());
    visFactoryService.clearAll()

    const currentApi  = JSON.parse(appState.getCurrentAPI()).id;
    const extensions  = appState.getExtensions(currentApi);
    $scope.extensions = extensions;

    $scope.agentsAutoComplete = AgentsAutoComplete;

    $scope.tabView = commonData.checkTabViewLocation();
    $scope.tab     = commonData.checkTabLocation();

    let tabHistory = [];
    if($scope.tab !== 'configuration' && $scope.tab !== 'welcome' && $scope.tab !== 'syscollector') tabHistory.push($scope.tab);

    // Tab names
    $scope.tabNames = TabNames;

    tabVisualizations.assign('agents');

    $scope.hostMonitoringTabs = ['general', 'fim', 'configuration', 'syscollector'];
    $scope.systemAuditTabs = ['pm', 'audit', 'oscap', 'ciscat'];
    $scope.securityTabs = ['vuls', 'virustotal'];
    $scope.complianceTabs = ['pci', 'gdpr'];

    $scope.inArray = (item, array) => item && Array.isArray(array) && array.includes(item);

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
                case 'ciscat':
                    createMetrics(metricsCiscat);
                    break;
                case 'virustotal':
                    createMetrics(metricsVirustotal);
                    break;
            }
        }
    }

    // Switch subtab
    $scope.switchSubtab = async (subtab, force = false, onlyAgent = false, sameTab = true, preserveDiscover = false) => {
        try {
            if($scope.tabView === subtab && !force) return;

            visFactoryService.clear(onlyAgent)
            $location.search('tabView', subtab);
            const localChange = (subtab === 'panels' && $scope.tabView === 'discover') && sameTab;
            $scope.tabView = subtab;

            if(subtab === 'panels' && $scope.tab !== 'configuration' && $scope.tab !== 'welcome' && $scope.tab !== 'syscollector'){
                const condition = !changeAgent && localChange || !changeAgent && preserveDiscover;
                await visFactoryService.buildAgentsVisualizations(filterHandler, $scope.tab, subtab, condition, $scope.agent.id)
                changeAgent = false;
            } else {
                $rootScope.$emit('changeTabView',{tabView:$scope.tabView})
            }

            checkMetrics($scope.tab, subtab);

            return;

        } catch (error) {
            errorHandler.handle(error,'Agents');
            return;
        }
    }


    let changeAgent = false;

    // Switch tab
    $scope.switchTab = (tab, force = false) => {
        if(tab !== 'configuration' && tab !== 'welcome' && tab !== 'syscollector') tabHistory.push(tab);
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
            $scope.load = true;
            changeAgent = true;

            const globalAgent = shareAgent.getAgent()

            if($scope.tab === 'configuration'){
                return $scope.getAgentConfig(newAgentId);
            }

            const id = commonData.checkLocationAgentId(newAgentId, globalAgent)

            const data = await Promise.all([
                apiReq.request('GET', `/agents/${id}`, {}),
                apiReq.request('GET', `/syscheck/${id}/last_scan`, {}),
                apiReq.request('GET', `/rootcheck/${id}/last_scan`, {}),
                apiReq.request('GET', `/syscollector/${id}/hardware`, {}),
                apiReq.request('GET', `/syscollector/${id}/os`, {})
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

            $scope.syscollector = {
                hardware: data[3].data.data,
                os: data[4].data.data
            }

            $scope.load = false;
            if(!$scope.$$phase) $scope.$digest();
            return;
        } catch (error) {
            errorHandler.handle(error,'Agents');
        }
        return;
    };

    $scope.goGroups = agent => {
        $scope.agentsAutoComplete.reset();
        visFactoryService.clearAll()
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

    $scope.downloadCsv = async data_path => {
        try {
            errorHandler.info('Your download should begin automatically...', 'CSV')
            const currentApi   = JSON.parse(appState.getCurrentAPI()).id;
            const output       = await csvReq.fetch(data_path, currentApi, wzTableFilter.get());
            const blob         = new Blob([output], {type: 'text/csv'});

            FileSaver.saveAs(blob, 'packages.csv');

            return;

        } catch (error) {
            errorHandler.handle(error,'Download CSV');
        }
        return;
    }


    //Destroy
    $scope.$on("$destroy", () => {
        visFactoryService.clearAll()
        $scope.agentsAutoComplete.reset();
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

    $scope.getAgentConfig = newAgentId => {
        if (newAgentId) {
            $location.search('agent', newAgentId);
        }
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

            const id = commonData.checkLocationAgentId(false, globalAgent)

            const data       = await apiReq.request('GET', `/agents/${id}`, {});
            $scope.agent     = data.data.data;
            $scope.groupName = $scope.agent.group;

            if(!$scope.groupName){

                $scope.configurationError = true;
                $scope.load = false;
                if(!$scope.$$phase) $scope.$digest();
                return;
            }

            const configurationData   = await apiReq.request('GET', `/agents/groups/${$scope.groupName}/configuration`, {});
            $scope.groupConfiguration = configurationData.data.data.items[0];
            $scope.rawJSON            = beautifier.prettyPrint(configurationData.data.data.items);

            const agentGroups = await Promise.all([
                apiReq.request('GET', `/agents/groups?search=${$scope.groupName}`, {}),
                apiReq.request('GET', `/agents/groups/${$scope.groupName}`, {})
            ]);


            const groupMergedSum  = agentGroups[0].data.data.items.filter(item => item.name === $scope.groupName);
            $scope.groupMergedSum = (groupMergedSum.length) ? groupMergedSum[0].mergedSum : 'Unknown';

            const agentMergedSum  = agentGroups[1].data.data.items.filter(item => item.id === $scope.agent.id);
            $scope.agentMergedSum = (agentMergedSum.length) ? agentMergedSum[0].merged_sum : 'Unknown';

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

    $scope.search = term => {
        $scope.$broadcast('wazuhSearch',{term})
    }

    $scope.startVis2Png = () => reportingService.startVis2Png($scope.tab, $scope.agent && $scope.agent.id ? $scope.agent.id : true);

    //Load
    try {
        $scope.getAgent();
        $scope.agentsAutoComplete.nextPage('');
    } catch (e) {
        errorHandler.handle('Unexpected exception loading controller','Agents');
    }

});
