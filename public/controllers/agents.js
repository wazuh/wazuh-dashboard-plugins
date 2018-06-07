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
import FilterHandler from './filter-handler'

const app = modules.get('app/wazuh', []);

app.controller('agentsController', function ($timeout, $scope, $location, $rootScope, appState, genericReq, apiReq, AgentsAutoComplete, errorHandler, rawVisualizations, loadedVisualizations, tabVisualizations, discoverPendingUpdates, visHandlers, vis2png, shareAgent) {
    $location.search('_a',null)
    const filterHandler = new FilterHandler(appState.getCurrentPattern());
    visHandlers.removeAll();
    discoverPendingUpdates.removeAll();
    rawVisualizations.removeAll();
    tabVisualizations.removeAll();
    loadedVisualizations.removeAll();

    $scope.extensions = appState.getExtensions().extensions;
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
    } else { // If tab doesn't exist, default it to 'general'
        $scope.tab = "general";
        $location.search("tab", "general");
    }
    tabHistory.push($scope.tab)

    // Metrics Audit
    const metricsAudit = {
        auditNewFiles     : '[vis-id="\'Wazuh-App-Agents-Audit-New-files-metric\'"]',
        auditReadFiles    : '[vis-id="\'Wazuh-App-Agents-Audit-Read-files-metric\'"]',
        auditModifiedFiles: '[vis-id="\'Wazuh-App-Agents-Audit-Modified-files-metric\'"]',
        auditRemovedFiles : '[vis-id="\'Wazuh-App-Agents-Audit-Removed-files-metric\'"]'
    }

    // Metrics Vulnerability Detector
    const metricsVulnerability = {
        vulnCritical: '[vis-id="\'Wazuh-App-Agents-VULS-Metric-Critical-severity\'"]',
        vulnHigh    : '[vis-id="\'Wazuh-App-Agents-VULS-Metric-High-severity\'"]',
        vulnMedium  : '[vis-id="\'Wazuh-App-Agents-VULS-Metric-Medium-severity\'"]',
        vulnLow     : '[vis-id="\'Wazuh-App-Agents-VULS-Metric-Low-severity\'"]'
    }

    // Metrics Scap
    const metricsScap = {
        scapLastScore   : '[vis-id="\'Wazuh-App-Agents-OSCAP-Last-score\'"]',
        scapHighestScore: '[vis-id="\'Wazuh-App-Agents-OSCAP-Higher-score-metric\'"]',
        scapLowestScore : '[vis-id="\'Wazuh-App-Agents-OSCAP-Lower-score-metric\'"]'
    }

    // Metrics Virustotal
    const metricsVirustotal = {
        virusMalicious: '[vis-id="\'Wazuh-App-Agents-Virustotal-Total-Malicious\'"]',
        virusPositives: '[vis-id="\'Wazuh-App-Agents-Virustotal-Total-Positives\'"]',
        virusTotal    : '[vis-id="\'Wazuh-App-Agents-Virustotal-Total\'"]'
    }

    tabVisualizations.assign({
        general      : 7,
        fim          : 8,
        pm           : 4,
        vuls         : 7,
        oscap        : 13,
        audit        : 15,
        gdpr         : 3,
        pci          : 3,
        virustotal   : 6,
        configuration: 0
    });

    // Object for matching nav items and Wazuh groups
    const tabFilters = {
        general   : { group: '' },
        fim       : { group: 'syscheck' },
        pm        : { group: 'rootcheck' },
        vuls      : { group: 'vulnerability-detector' },
        oscap     : { group: 'oscap' },
        audit     : { group: 'audit' },
        pci       : { group: 'pci_dss' },
        virustotal: { group: 'virustotal' },
        gdpr      : { group: 'gdpr' }
    };

    let filters = []
    const assignFilters = (tab,agent,localChange) => {
        try {
            filters = [];

            const isCluster = appState.getClusterInfo().status == 'enabled';
            filters.push(filterHandler.managerQuery(
                isCluster ?
                appState.getClusterInfo().cluster :
                appState.getClusterInfo().manager,
                isCluster
            ))

            if(tab !== 'general'){
                if(tab === 'pci') {
                    filters.push(filterHandler.pciQuery())
                } else if(tab === 'gdpr') {
                    filters.push(filterHandler.gdprQuery())
                } else {
                    filters.push(filterHandler.ruleGroupQuery(tabFilters[tab].group));
                }
            }

            filters.push(filterHandler.agentQuery(agent));
            $rootScope.$emit('wzEventFilters',{filters, localChange});
            if(!$rootScope.$$listenerCount['wzEventFilters']){
                $timeout(100)
                .then(() => assignFilters(tab,agent))
            }
        } catch (error){
            errorHandler.handle('An error occurred while creating custom filters for visualizations','Agents',true);
        }
    }

    const generateMetric = id => {
        let html = $(id).html();
        if (typeof html !== 'undefined' && html.includes('<span')) {
            if(typeof html.split('<span>')[1] !== 'undefined'){
                return html.split('<span>')[1].split('</span')[0];
            } else if(html.includes('table') && html.includes('cell-hover')){
                let nonB = html.split('ng-non-bindable')[1];
                if(nonB &&
                    nonB.split('>')[1] &&
                    nonB.split('>')[1].split('</')[0]
                ) {
                    return nonB.split('>')[1].split('</')[0];
                }
            }
        }
        return '';
    }

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

        if(subtab === 'panels' && $scope.tab !== 'configuration'){
            // Create current tab visualizations
            genericReq.request('GET',`/api/wazuh-elastic/create-vis/agents-${$scope.tab}/${appState.getCurrentPattern()}`)
            .then(data => {
                rawVisualizations.assignItems(data.data.raw);
                assignFilters($scope.tab, $scope.agent.id, localChange || preserveDiscover);
                $rootScope.$emit('changeTabView',{tabView:subtab})
                $rootScope.$broadcast('updateVis');
                checkMetrics($scope.tab, 'panels');
            })
            .catch(error => errorHandler.handle(error, 'Agents'));
        } else {
            $rootScope.$emit('changeTabView',{tabView:$scope.tabView})
            checkMetrics($scope.tab, subtab);
        }
    }

    // Switch tab
    $scope.switchTab = (tab, force = false) => {
        tabHistory.push(tab)
        if (tabHistory.length > 3) tabHistory = tabHistory.slice(-3);
        tabVisualizations.setTab(tab);
        if ($scope.tab === tab && !force) return;
        const onlyAgent = $scope.tab === tab && force;
        const sameTab = $scope.tab === tab;
        $location.search('tab', tab);
        const preserveDiscover = tabHistory.length === 3 && tabHistory[0] === tabHistory[2] && tabHistory[1] === 'configuration';
        $scope.tab = tab;

        if($scope.tab === 'configuration'){
            firstLoad();
        } else {
            $scope.switchSubtab('panels', true, onlyAgent, sameTab, preserveDiscover);
        }
    };


    // Agent data
    $scope.getAgentStatusClass = (agentStatus) => agentStatus === "Active" ? "teal" : "red";

    $scope.formatAgentStatus = (agentStatus) => {
        return ['Active','Disconnected'].includes(agentStatus) ? agentStatus : 'Never connected';
    };

    const calculateMinutes = (start,end) => {
        let time    = new Date(start);
        let endTime = new Date(end);
        let minutes = ((endTime - time) / 1000) / 60;
        return minutes;
    }

    const validateRootCheck = () => {
        $scope.agent.rootcheck.duration = 'Unknown';
        if ($scope.agent.rootcheck.end && $scope.agent.rootcheck.start) {
            $scope.agent.rootcheck.duration = ((new Date($scope.agent.rootcheck.end) - new Date($scope.agent.rootcheck.start))/1000)/60;
            $scope.agent.rootcheck.duration = Math.round($scope.agent.rootcheck.duration * 100) / 100;

            if($scope.agent.rootcheck.duration <= 0){
                $scope.agent.rootcheck.inProgress = true;
            }
        } else {
            if (!$scope.agent.rootcheck.end) {
                $scope.agent.rootcheck.end = 'Unknown';
            }
            if (!$scope.agent.rootcheck.start){
                $scope.agent.rootcheck.start = 'Unknown';
            }
        }
    }

    const validateSysCheck = () => {
        $scope.agent.syscheck.duration = 'Unknown';
        if ($scope.agent.syscheck.end && $scope.agent.syscheck.start) {
            $scope.agent.syscheck.duration = ((new Date($scope.agent.syscheck.end) - new Date($scope.agent.syscheck.start))/1000)/60;
            $scope.agent.syscheck.duration = Math.round($scope.agent.syscheck.duration * 100) / 100;
            if($scope.agent.syscheck.duration <= 0){
                $scope.agent.syscheck.inProgress = true;
            }
        } else {
            if (!$scope.agent.syscheck.end) {
                $scope.agent.syscheck.end = 'Unknown';
            }
            if (!$scope.agent.syscheck.start){
                $scope.agent.syscheck.start = 'Unknown';
            }
        }
    }

    $scope.getAgent = async (newAgentId,fromAutocomplete) => {
        try {
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

    //PCI tab
    let pciTabs = [];
    genericReq.request('GET', '/api/wazuh-api/pci/all')
        .then((data) => {
            for(let key in data.data){
                pciTabs.push({
                    "title": key,
                    "content": data.data[key]
                });
            }
        })
        .catch(error => errorHandler.handle(error,'Agents'));

    $scope.pciTabs       = pciTabs;
    $scope.selectedPciIndex = 0;

    //GDPR tab
    let gdprTabs = [];
    genericReq.request('GET', '/api/wazuh-api/gdpr/all')
        .then((data) => {
            for(let key in data.data){
                gdprTabs.push({
                    "title": key,
                    "content": data.data[key]
                });
            }
        })
        .catch(error => errorHandler.handle(error,'Agents'));

    $scope.gdprTabs       = gdprTabs;
    $scope.selectedGdprIndex = 0;

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

    $scope.startVis2Png = async () => {
        try {
            if(vis2png.isWorking()){
                errorHandler.handle('Report in progress', 'Reporting',true);
                return;
            }
            $scope.reportBusy = true;
            $rootScope.reportStatus = 'Generating report...0%'
            if(!$rootScope.$$phase) $rootScope.$digest();
            
            vis2png.clear();
            
            const idArray = rawVisualizations.getList().map(item => item.id);

            for(const item of idArray) {
                const tmpHTMLElement = $(`#${item}`);
                vis2png.assignHTMLItem(item,tmpHTMLElement)
            }            
            
            const appliedFilters = visHandlers.getAppliedFilters();
            const tab   = $scope.tab;
            const array = await vis2png.checkArray(idArray)
            const name  = `wazuh-agents-${tab}-${Date.now() / 1000 | 0}.pdf`
            
            const data    ={
                array,
                name,
                title: `Agents ${tab}`, 
                filters: appliedFilters.filters, 
                time: appliedFilters.time,
                searchBar: appliedFilters.searchBar,
                tab,
                section: 'agents',
                isAgents: true
            };

            const request = await genericReq.request('POST','/api/wazuh-api/report',data)
            
            $scope.reportBusy = false;
            $rootScope.reportStatus = false;
            
            errorHandler.info('Success. Go to Management -> Reporting', 'Reporting')
            
            return;
        } catch (error) {
            $scope.reportBusy = false;
            $rootScope.reportStatus = false;
            errorHandler.handle(error, 'Reporting')
        }
    }

    //Load
    try {    
        $scope.getAgent();
        $scope.agentsAutoComplete.nextPage('');
    } catch (e) {
        errorHandler.handle('Unexpected exception loading controller','Agents');
    }
    
});
