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
import $            from 'jquery';
import * as modules from 'ui/modules'

const app = modules.get('app/wazuh', []);

app.controller('overviewController', function ($scope, $location, $rootScope, appState, genericReq, errorHandler, apiReq) {
    $rootScope.rawVisualizations = null;

    $rootScope.page = 'overview';
    $scope.extensions = appState.getExtensions().extensions;

    $scope.wzMonitoringEnabled = false;

    // Metrics General
    const metricsGeneral = {
        totalAlerts: '[vis-id="\'Wazuh-App-Overview-General-Metric-alerts\'"]',
        level12    : '[vis-id="\'Wazuh-App-Overview-General-Level-12-alerts\'"]',
        authFailure: '[vis-id="\'Wazuh-App-Overview-General-Authentication-failure\'"]',
        authSuccess: '[vis-id="\'Wazuh-App-Overview-General-Authentication-success\'"]'
    }

    // Metrics FIM
    const metricsFim = {
        fimAdded   : '[vis-id="\'Wazuh-App-Overview-FIM-Added\'"]',
        fimModified: '[vis-id="\'Wazuh-App-Overview-FIM-Modified\'"]',
        fimDeleted : '[vis-id="\'Wazuh-App-Overview-FIM-Deleted\'"]'
    }

    // Metrics Audit
    const metricsAudit = {
        auditNewFiles     : '[vis-id="\'Wazuh-App-Overview-Audit-New-files\'"]',
        auditReadFiles    : '[vis-id="\'Wazuh-App-Overview-Audit-Read-files\'"]',
        auditModifiedFiles: '[vis-id="\'Wazuh-App-Overview-Audit-Modified-files\'"]',
        auditRemovedFiles : '[vis-id="\'Wazuh-App-Overview-Audit-Removed-files\'"]'
    }

    // Metrics Vulnerability Detector
    const metricsVulnerability = {
        vulnCritical: '[vis-id="\'Wazuh-App-Overview-VULS-Metric-Critical-severity\'"]',
        vulnHigh    : '[vis-id="\'Wazuh-App-Overview-VULS-Metric-High-severity\'"]',
        vulnMedium  : '[vis-id="\'Wazuh-App-Overview-VULS-Metric-Medium-severity\'"]',
        vulnLow     : '[vis-id="\'Wazuh-App-Overview-VULS-Metric-Low-severity\'"]'
    }

    // Metrics Scap
    const metricsScap = {
        scapLastScore   : '[vis-id="\'Wazuh-App-Overview-OSCAP-Last-score\'"]',
        scapHighestScore: '[vis-id="\'Wazuh-App-Overview-OSCAP-Highest-score\'"]',
        scapLowestScore : '[vis-id="\'Wazuh-App-Overview-OSCAP-Lowest-score\'"]'
    }

    // Metrics Virustotal
    const metricsVirustotal = {
        virusMalicious: '[vis-id="\'Wazuh-App-Overview-Virustotal-Total-Malicious\'"]',
        virusPositives: '[vis-id="\'Wazuh-App-Overview-Virustotal-Total-Positives\'"]',
        virusTotal    : '[vis-id="\'Wazuh-App-Overview-Virustotal-Total\'"]'
    }

    // Metrics AWS
    const metricsAws = {
        awsLogins        :'[vis-id="\'Wazuh-App-Overview-AWS-Metric-Successful-logins\'"]',
        awsMostActiveUser:'[vis-id="\'Wazuh-App-Overview-AWS-Most-active-user\'"]',
        awsAuthorized    :'[vis-id="\'Wazuh-App-Overview-AWS-Metric-Authorize-security\'"]',
        awsRevoked       :'[vis-id="\'Wazuh-App-Overview-AWS-Metric-Revoke-security\'"]'
    }

    // Check the url hash and retrieve tabView information
    if ($location.search().tabView) {
        $scope.tabView = $location.search().tabView;
    } else { // If tabView doesn't exist, default it to 'panels'
        $scope.tabView = 'panels';
        $location.search('tabView', 'panels');
    }

    // Check the url hash and retrieve tab information
    if ($location.search().tab) {
        $scope.tab = $location.search().tab;
    } else { // If tab doesn't exist, default it to 'general'
        $scope.tab = 'general';
        $location.search('tab', 'general');

        // Now we initialize the implicitFilter
        $rootScope.currentImplicitFilter = "";
    }

    // This object represents the number of visualizations per tab; used to show a progress bar
    $rootScope.tabVisualizations = {
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
    };

    // Object for matching nav items and rules groups
    const tabFilters = {
        general   : { group: '' },
        fim       : { group: 'syscheck' },
        pm        : { group: 'rootcheck' },
        vuls      : { group: 'vulnerability-detector' },
        oscap     : { group: 'oscap' },
        audit     : { group: 'audit' },
        pci       : { group: 'pci_dss' },
        gdpr      : { group: 'gdpr' },
        aws       : { group: 'amazon' },
        virustotal: { group: 'virustotal' }
    };

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

        if(!$rootScope.$$phase) $rootScope.$digest();
    }

    // Switch subtab
    $scope.switchSubtab = subtab => {
        if ($scope.tabView === subtab) return;

        if(subtab === 'panels'){
            $rootScope.rawVisualizations = null;

            // Create current tab visualizations
            genericReq.request('GET',`/api/wazuh-elastic/create-vis/overview-${$scope.tab}/${appState.getCurrentPattern()}`)
            .then(data => {
                $rootScope.rawVisualizations = data.data.raw;
                // Render visualizations
                $rootScope.$broadcast('updateVis');
                checkMetrics($scope.tab, 'panels');
            })
            .catch(error => errorHandler.handle(error, 'Overview'));
        } else {
            checkMetrics($scope.tab, subtab);
        }
    }

    // Switch tab
    $scope.switchTab = tab => {
        if ($scope.tab === tab) return;
        $rootScope.rawVisualizations = null;

        // Create current tab visualizations
        genericReq.request('GET',`/api/wazuh-elastic/create-vis/overview-${tab}/${appState.getCurrentPattern()}`)
        .then(data => {
            $rootScope.rawVisualizations = data.data.raw;
            // Render visualizations
            $rootScope.$broadcast('updateVis');

            checkMetrics(tab, 'panels');

            // Deleting app state traces in the url
            $location.search('_a', null);

        })
        .catch(error => errorHandler.handle(error, 'Overview'));
    };

    // Watch tabView
    $scope.$watch('tabView', () => {
        $location.search('tabView', $scope.tabView);

        if ($rootScope.ownHandlers) {
            for (let h of $rootScope.ownHandlers) {
                h._scope.$destroy();
            }
        }
        $rootScope.ownHandlers = [];

        $rootScope.loadedVisualizations = [];
    });

    // Watch tab
    $scope.$watch('tab', () => {

        $location.search('tab', $scope.tab);

        $scope.tabView = 'panels';

        if ($rootScope.ownHandlers) {
            for (let h of $rootScope.ownHandlers) {
                h._scope.$destroy();
            }
        }
        $rootScope.ownHandlers = [];

        $rootScope.loadedVisualizations = [];

        // Update the implicit filter
        if (tabFilters[$scope.tab].group === "") $rootScope.currentImplicitFilter = "";
        else $rootScope.currentImplicitFilter = tabFilters[$scope.tab].group;
    });

    $scope.$on('$destroy', () => {
        $rootScope.rawVisualizations = null;
        if ($rootScope.ownHandlers) {
            for (let h of $rootScope.ownHandlers) {
                h._scope.$destroy();
            }
        }

        $rootScope.ownHandlers = [];
    });

    // Create visualizations for controller's first execution
    genericReq.request('GET',`/api/wazuh-elastic/create-vis/overview-${$scope.tab}/${appState.getCurrentPattern()}`)
    .then(data => {
        $rootScope.rawVisualizations = data.data.raw;
        // Render visualizations
        $rootScope.$broadcast('updateVis');

        checkMetrics($scope.tab, $scope.tabView);
    })
    .catch(error => {
        errorHandler.handle(error, 'Overview');
    });

    //PCI tab
    let pciTabs = [];
    genericReq
        .request('GET', '/api/wazuh-api/pci/all')
        .then(data => {
            for (let key in data.data) {
                pciTabs.push({
                    "title": key,
                    "content": data.data[key]
                });
            }
        })
        .catch(error => {
            errorHandler.handle(error, 'Overview');
            if (!$rootScope.$$phase) $rootScope.$digest();
        });

    $scope.pciTabs = pciTabs;
    $scope.selectedPciIndex = 0;

    //GDPR tab
    let gdprTabs = [];
    genericReq
        .request('GET', '/api/wazuh-api/gdpr/all')
        .then(data => {
            for (let key in data.data) {
                gdprTabs.push({
                    "title": key,
                    "content": data.data[key]
                });
            }
        })
        .catch(error => {
            errorHandler.handle(error, 'Overview');
            if (!$rootScope.$$phase) $rootScope.$digest();
        });

    $scope.gdprTabs = gdprTabs;
    $scope.selectedGdprIndex = 0;

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
                .catch(error => {
                    errorHandler.handle(error, 'Overview - Monitoring');
                    if (!$rootScope.$$phase) $rootScope.$digest();
                })
            }
        } else {
            $scope.wzMonitoringEnabled = true;
        }
    })
    .catch(error => {console.log(error.message || error);$scope.wzMonitoringEnabled = true});
});
