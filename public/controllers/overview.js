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
import { uiModules } from 'ui/modules'
import FilterHandler  from '../utils/filter-handler'
import generateMetric from '../utils/generate-metric'
import TabNames       from '../utils/tab-names'
import { metricsGeneral, metricsFim, metricsAudit, metricsVulnerability, metricsScap, metricsCiscat, metricsVirustotal, metricsAws } from '../utils/overview-metrics'

const app = uiModules.get('app/wazuh', []);

app.controller('overviewController', function ($scope, $location, $rootScope, appState, genericReq, errorHandler, apiReq, tabVisualizations, commonData, reportingService, visFactoryService) {

    $rootScope.reportStatus = false;

    $location.search('_a',null)
    const filterHandler = new FilterHandler(appState.getCurrentPattern());
    visFactoryService.clearAll()

    const currentApi  = JSON.parse(appState.getCurrentAPI()).id;
    const extensions  = appState.getExtensions(currentApi);
    $scope.extensions = extensions;

    $scope.wzMonitoringEnabled = false;

    // Tab names
    $scope.tabNames = TabNames;

    $scope.tabView = commonData.checkTabViewLocation();
    $scope.tab     = commonData.checkTabLocation();

    let tabHistory = [];
    if($scope.tab !== 'welcome') tabHistory.push($scope.tab);

    // This object represents the number of visualizations per tab; used to show a progress bar
    tabVisualizations.assign('overview');

    $scope.hostMonitoringTabs = ['general', 'fim', 'aws'];
    $scope.systemAuditTabs = ['pm', 'audit', 'oscap', 'ciscat'];
    $scope.securityTabs = ['vuls', 'virustotal'];
    $scope.complianceTabs = ['pci', 'gdpr'];

    $scope.inArray = (item, array) => {
        return (array.indexOf(item) !== -1);
    };

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
                case 'ciscat':
                    createMetrics(metricsCiscat);
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
    $scope.switchSubtab = async (subtab, force = false, sameTab = true, preserveDiscover = false) => {
        try {

            if ($scope.tabView === subtab && !force) return;

            visFactoryService.clear()
            $location.search('tabView', subtab);
            const localChange = (subtab === 'panels' && $scope.tabView === 'discover') && sameTab;
            $scope.tabView = subtab;

            if(subtab === 'panels' && $scope.tab !== 'welcome'){
                await visFactoryService.buildOverviewVisualizations(filterHandler, $scope.tab, subtab, localChange || preserveDiscover)
            } else {
                $rootScope.$emit('changeTabView',{tabView:$scope.tabView})
            }

            checkMetrics($scope.tab, subtab)

            return;

        } catch (error) {
            errorHandler.handle(error, 'Overview')
            return;
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

    $scope.startVis2Png = () => reportingService.startVis2Png($scope.tab);


    // PCI and GDPR requirements
    const loadPciAndGDPR = async () => {
        try {

            const data = await Promise.all([commonData.getPCI(),commonData.getGDPR()])

            $scope.pciTabs           = data[0];
            $scope.selectedPciIndex  = 0;
            $scope.gdprTabs          = data[1];
            $scope.selectedGdprIndex = 0;

            return;

        } catch (error) {
            return Promise.reject(error)
        }
    }

    const loadConfiguration = async () => {
        try {
            const configuration = await genericReq.request('GET', '/api/wazuh-api/configuration', {})

            if(configuration && configuration.data && configuration.data.data) {
                $scope.wzMonitoringEnabled = typeof configuration.data.data['wazuh.monitoring.enabled']  !== 'undefined' ?
                                                !!configuration.data.data['wazuh.monitoring.enabled'] :
                                                true;
                if(!$scope.wzMonitoringEnabled){
                    const data = await apiReq.request('GET', '/agents/summary', { })

                    if(data && data.data && data.data.data){
                        $scope.agentsCountActive         = data.data.data.Active;
                        $scope.agentsCountDisconnected   = data.data.data.Disconnected;
                        $scope.agentsCountNeverConnected = data.data.data['Never connected'];
                        $scope.agentsCountTotal          = data.data.data.Total;
                        $scope.agentsCoverity            = (data.data.data.Active / data.data.data.Total) * 100;
                    } else {
                        throw new Error('Error fetching /agents/summary from Wazuh API')
                    }
                }
            } else {
                $scope.wzMonitoringEnabled = true;
            }

            return;

        } catch (error) {
            $scope.wzMonitoringEnabled = true
            return Promise.reject(error)
        }
    }

    const init = async () => {
        try {
            await Promise.all([
                loadPciAndGDPR(),
                loadConfiguration()
            ])

            $scope.switchTab($scope.tab,true);

            return;

        } catch (error) {
            errorHandler.handle(error, 'Overview (init)')
            return;
        }
    }

    init();

    $scope.$on('$destroy', () => {
        visFactoryService.clearAll()
    });
});
