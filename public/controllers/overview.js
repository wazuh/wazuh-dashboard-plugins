const app = require('ui/modules').get('app/wazuh', []);
import $ from 'jquery';

app.controller('overviewController', function ($scope, $location, $rootScope, appState, genericReq, errorHandler, metricService) {
    $rootScope.page = 'overview';
    $scope.extensions = appState.getExtensions().extensions;

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

    // Check the url hash and retrieve the tabView information
    if ($location.search().tabView) {
        $scope.tabView = $location.search().tabView;
    } else { // If tabView doesn't exist, default it to 'panels'
        $scope.tabView = 'panels';
        $location.search('tabView', 'panels');
    }

    // Check the url hash and retrivew the tab information
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
        aws       : { group: 'amazon' },
        virustotal: { group: 'virustotal' }
    };

    const checkMetrics = (tab,subtab) => {
        metricService.destroyWatchers();
        if(tab === 'general' && subtab === 'panels'){
            metricService.createWatchers(metricsGeneral);
        }

        if(tab === 'fim' && subtab === 'panels'){
            metricService.createWatchers(metricsFim);
        } 

        if(tab === 'audit' && subtab === 'panels'){
            metricService.createWatchers(metricsAudit);
        } 

        if(tab === 'vuls' && subtab === 'panels'){
            metricService.createWatchers(metricsVulnerability);
        }
        if(!$rootScope.$$phase) $rootScope.$digest();
    }
    
    checkMetrics($scope.tab,$scope.tabView);

    // Switch subtab
    $scope.switchSubtab = subtab => {
        if ($scope.tabView === subtab) return;

        $scope.tabView = subtab;

        checkMetrics($scope.tab,subtab);
    }
    // Switch tab
    $scope.switchTab = tab => {
        if ($scope.tab === tab) return;

        checkMetrics(tab,$scope.tabView);

        if ($rootScope.ownHandlers) {
            for (let h of $rootScope.ownHandlers) {
                h._scope.$destroy();
            }
        }
        $rootScope.ownHandlers = [];

        // Deleting app state traces in the url
        $location.search('_a', null);
        $scope.tabView = 'panels';

        $rootScope.loadedVisualizations = [];
    };

    // Watchers

    // We watch the resultState provided by the discover
    $scope.$watch('tabView', () => $location.search('tabView', $scope.tabView));
    $scope.$watch('tab', () => {
        $location.search('tab', $scope.tab);
        // Update the implicit filter
        if (tabFilters[$scope.tab].group === "") $rootScope.currentImplicitFilter = "";
        else $rootScope.currentImplicitFilter = tabFilters[$scope.tab].group;
    });

    $scope.$on('$destroy', () => {
        if ($rootScope.ownHandlers) {
            for (let h of $rootScope.ownHandlers) {
                h._scope.$destroy();
            }
        }

        if(metricService.hasItems()) metricService.destroyWatchers();

        $rootScope.ownHandlers = [];
    });

    //PCI tab
    let tabs = [];
    genericReq
        .request('GET', '/api/wazuh-api/pci/all')
        .then(data => {
            for (let key in data.data) {
                tabs.push({
                    "title": key,
                    "content": data.data[key]
                });
            }
        })
        .catch(error => {
            errorHandler.handle(error, 'Overview');
            if (!$rootScope.$$phase) $rootScope.$digest();
        });

    $scope.tabs = tabs;
    $scope.selectedIndex = 0;


});
