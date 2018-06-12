/*
 * Wazuh app - Overview controller
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import $              from 'jquery';
import * as modules   from 'ui/modules'
import FilterHandler  from './filter-handler'
import generateMetric from '../utils/generate-metric'
import TabNames       from '../utils/tab-names'
import { metricsGeneral, metricsFim, metricsAudit, metricsVulnerability, metricsScap, metricsVirustotal, metricsAws } from '../utils/overview-metrics'

const app = modules.get('app/wazuh', []);

app.controller('overviewController', function ($sce, $timeout, $scope, $location, $rootScope, appState, genericReq, errorHandler, apiReq, rawVisualizations, loadedVisualizations, tabVisualizations, discoverPendingUpdates, visHandlers, vis2png, commonData) {

    $location.search('_a',null)
    const filterHandler = new FilterHandler(appState.getCurrentPattern());
    discoverPendingUpdates.removeAll();
    rawVisualizations.removeAll();
    tabVisualizations.removeAll();
    loadedVisualizations.removeAll();

   
    const currentApi  = JSON.parse(appState.getCurrentAPI()).id;
    const extensions  = appState.getExtensions(currentApi);
    $scope.extensions = extensions;

    $scope.wzMonitoringEnabled = false;

    // Tab names
    $scope.tabNames = TabNames;

    let tabHistory = [];

    // Check the url hash and retrieve tabView information
    if ($location.search().tabView) {
        $scope.tabView = $location.search().tabView;
    } else { // If tabView doesn't exist, default it to 'panels'
        $scope.tabView = 'panels';
        $location.search('tabView', 'panels');
    }

    if($scope.tab !== 'welcome') tabHistory.push($scope.tab);

    // Check the url hash and retrieve tab information
    if ($location.search().tab) {
        $scope.tab = $location.search().tab;
    } else { // If tab doesn't exist, default it to 'welcome'
        $scope.tab = 'welcome';
        $location.search('tab', 'welcome');
    }

    // This object represents the number of visualizations per tab; used to show a progress bar
    tabVisualizations.assign({
        welcome   : 0,
        general   : 11,
        fim       : 10,
        pm        : 5,
        vuls      : 8,
        oscap     : 14,
        audit     : 15,
        pci       : 6,
        gdpr      : 6,
        aws       : 10,
        virustotal: 7
    });

    const createMetrics = metricsObject => {
        for(let key in metricsObject) {
            $scope[key] = () => generateMetric(metricsObject[key]);
        }
    }

    const checkMetrics = (tab, subtab) => {
        if(subtab === 'panels'){
            switch (tab) {
                case 'general':
                    createMetrics(metricsGeneral);
                    break;
                case 'fim':
                    createMetrics(metricsFim);
                    break;
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
                case 'aws':
                    createMetrics(metricsAws);
                    break;
            }
        }
    }

    // Switch subtab
    $scope.switchSubtab = (subtab, force = false, sameTab = true, preserveDiscover = false) => {
        if ($scope.tabView === subtab && !force) return;

        visHandlers.removeAll();
        discoverPendingUpdates.removeAll();
        rawVisualizations.removeAll();
        loadedVisualizations.removeAll();

        $location.search('tabView', subtab);
        const localChange = ((subtab === 'panels' && $scope.tabView === 'discover') ||
                             (subtab === 'discover' && $scope.tabView === 'panels')) && sameTab;
        if(subtab === 'panels' && $scope.tabView === 'discover'  && sameTab){
            $rootScope.$emit('changeTabView',{tabView:$scope.tabView})
        }

        $scope.tabView = subtab;

        if(subtab === 'panels' && $scope.tab !== 'welcome'){
            // Create current tab visualizations
            genericReq.request('GET',`/api/wazuh-elastic/create-vis/overview-${$scope.tab}/${appState.getCurrentPattern()}`)
            .then(data => {
                rawVisualizations.assignItems(data.data.raw);
                commonData.assignFilters(filterHandler, $scope.tab, localChange || preserveDiscover);
                $rootScope.$emit('changeTabView',{tabView:subtab})
                $rootScope.$broadcast('updateVis');
                checkMetrics($scope.tab, 'panels');
            })
            .catch(error => errorHandler.handle(error, 'Overview'));
        } else {
            $rootScope.$emit('changeTabView',{tabView:$scope.tabView})
            checkMetrics($scope.tab, subtab);
        }
    }

    // Switch tab
    $scope.switchTab = (tab,force = false) => {
        if(tab !== 'welcome') tabHistory.push(tab);
        if (tabHistory.length > 2) tabHistory = tabHistory.slice(-2);
        tabVisualizations.setTab(tab);
        if ($scope.tab === tab && !force) return;
        const sameTab = $scope.tab === tab;
        $location.search('tab', tab);
        const preserveDiscover = tabHistory.length === 2 && tabHistory[0] === tabHistory[1];
        $scope.tab = tab;

        $scope.switchSubtab('panels', true, sameTab, preserveDiscover);
    };

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

            const idArray = rawVisualizations.getList().map(item => {
                const tmpHTMLElement = $(`#${item.id}`);
                vis2png.assignHTMLItem(item.id,tmpHTMLElement)
                return item.id;
            });

            const appliedFilters = visHandlers.getAppliedFilters();
            const tab   = $scope.tab;
            const array = await vis2png.checkArray(idArray)
            const name  = `wazuh-overview-${tab}-${Date.now() / 1000 | 0}.pdf`

            const data    ={
                array,
                name,
                title: `Overview ${tab}`,
                filters: appliedFilters.filters,
                time: appliedFilters.time,
                searchBar: appliedFilters.searchBar,
                tab,
                section: 'overview'
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

    $scope.$on('$destroy', () => {
        discoverPendingUpdates.removeAll();
        rawVisualizations.removeAll();
        tabVisualizations.removeAll();
        loadedVisualizations.removeAll();
        visHandlers.removeAll();
    });

    $scope.switchTab($scope.tab,true);

    // PCI and GDPR requirements
    Promise.all([commonData.getPCI(),commonData.getGDPR()])
    .then(data => {
        $scope.pciTabs           = data[0];
        $scope.selectedPciIndex  = 0;
        $scope.gdprTabs          = data[1];
        $scope.selectedGdprIndex = 0;
    })
    .catch(error => errorHandler.handle(error,'Overview'));

    genericReq.request('GET', '/api/wazuh-api/configuration', {})
    .then(configuration => {
        if(configuration && configuration.data && configuration.data.data) {
            $scope.wzMonitoringEnabled = typeof configuration.data.data['wazuh.monitoring.enabled']  !== 'undefined' ?
                                         !!configuration.data.data['wazuh.monitoring.enabled'] :
                                         true;
            if(!$scope.wzMonitoringEnabled){
                apiReq.request('GET', '/agents/summary', { })
                .then(data => {
                    if(data && data.data && data.data.data){
                        $scope.agentsCountActive         = data.data.data.Active;
                        $scope.agentsCountDisconnected   = data.data.data.Disconnected;
                        $scope.agentsCountNeverConnected = data.data.data['Never connected'];
                        $scope.agentsCountTotal          = data.data.data.Total;
                        $scope.agentsCoverity            = (data.data.data.Active / data.data.data.Total) * 100;
                    } else {
                        throw new Error('Error fetching /agents/summary from Wazuh API')
                    }
                })
                .catch(error => errorHandler.handle(error, 'Overview - Monitoring'))
            }
        } else {
            $scope.wzMonitoringEnabled = true;
        }
    })
    .catch(error => {
        $scope.wzMonitoringEnabled = true
        errorHandler.handle(error, 'Overview');
    });
});
