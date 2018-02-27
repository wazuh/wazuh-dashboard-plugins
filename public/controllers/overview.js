const app = require('ui/modules').get('app/wazuh', []);
import $ from 'jquery';
//

app.controller('overviewController', function ($scope, $location, $rootScope, appState, genericReq, errorHandler) {
    $rootScope.page = 'overview';
    $scope.extensions = appState.getExtensions().extensions;

    // Metrics General
    let watcher1, watcher2, watcher3, watcher4;

    $scope.totalAlerts = '';
    $scope.level12     = '';
    $scope.authFailure = '';
    $scope.authSuccess = '';
    const assignWatcher1 = () => {
        watcher1 = $scope.$watch(() => {
            return $('[vis-id="\'Wazuh-App-Overview-General-Metric-alerts\'"] > visualize > visualization > div > div > div > div > div.metric-value.ng-binding > span').text();
        }, (newVal, oldVal) => {
            if (newVal !== oldVal) {
                $scope.totalAlerts = newVal;
                if (!$scope.$$phase) $scope.$digest();
            }
        });
    }
    const assignWatcher2 = () => {
        watcher2 = $scope.$watch(() => {
            return $('[vis-id="\'Wazuh-App-Overview-General-Level-12-alerts\'"] > visualize > visualization > div > div > div > div > div.metric-value.ng-binding > span').text();
        }, (newVal, oldVal) => {
            if (newVal !== oldVal) {
                $scope.level12 = newVal;
                if (!$scope.$$phase) $scope.$digest();
            }
        });
    }

    const assignWatcher3 = () => {
        watcher3 = $scope.$watch(() => {
            return $('[vis-id="\'Wazuh-App-Overview-General-Authentication-failure\'"] > visualize > visualization > div > div > div > div > div.metric-value.ng-binding > span').text();
        }, (newVal, oldVal) => {
            if (newVal !== oldVal) {
                $scope.authFailure = newVal;
                if (!$scope.$$phase) $scope.$digest();
            }
        });
    }

    const assignWatcher4 = () => {
        watcher4 = $scope.$watch(() => {
            return $('[vis-id="\'Wazuh-App-Overview-General-Authentication-success\'"] > visualize > visualization > div > div > div > div > div.metric-value.ng-binding > span').text();
        }, (newVal, oldVal) => {
            if (newVal !== oldVal) {
                $scope.authSuccess = newVal;
                if (!$scope.$$phase) $scope.$digest();
            }
        });
    }

    // Metrics FIM
    let watcher5, watcher6, watcher7;

    $scope.fimAdded    = '';
    $scope.fimModified = '';
    $scope.fimDeleted  = '';

    const assignWatcher5 = () => {
        watcher5 = $scope.$watch(() => {
            return $('[vis-id="\'Wazuh-App-Overview-FIM-Added\'"] > visualize > visualization > div > div > div > div > div.metric-value.ng-binding > span').text();
        }, (newVal, oldVal) => {
            if (newVal !== oldVal) {
                $scope.fimAdded = newVal;
                if (!$scope.$$phase) $scope.$digest();
            }
        });
    }
    const assignWatcher6 = () => {
        watcher6 = $scope.$watch(() => {
            return $('[vis-id="\'Wazuh-App-Overview-FIM-Modified\'"] > visualize > visualization > div > div > div > div > div.metric-value.ng-binding > span').text();
        }, (newVal, oldVal) => {
            if (newVal !== oldVal) {
                $scope.fimModified = newVal;
                if (!$scope.$$phase) $scope.$digest();
            }
        });
    }

    const assignWatcher7 = () => {
        watcher7 = $scope.$watch(() => {
            return $('[vis-id="\'Wazuh-App-Overview-FIM-Deleted\'"] > visualize > visualization > div > div > div > div > div.metric-value.ng-binding > span').text();
        }, (newVal, oldVal) => {
            if (newVal !== oldVal) {
                $scope.fimDeleted = newVal;
                if (!$scope.$$phase) $scope.$digest();
            }
        });
    }

    // Metrics Audit
    let watcher8, watcher9, watcher10, watcher11;

    $scope.auditNewFiles      = '';
    $scope.auditReadFiles     = '';
    $scope.auditModifiedFiles = '';
    $scope.auditRemovedFiles  = '';

    const assignWatcher8 = () => {
        watcher8 = $scope.$watch(() => {
            return $('[vis-id="\'Wazuh-App-Overview-Audit-New-files\'"] > visualize > visualization > div > div > div > div > div.metric-value.ng-binding > span').text();
        }, (newVal, oldVal) => {
            if (newVal !== oldVal) {
                $scope.auditNewFiles = newVal;
                if (!$scope.$$phase) $scope.$digest();
            }
        });
    }
    const assignWatcher9 = () => {
        watcher9 = $scope.$watch(() => {
            return $('[vis-id="\'Wazuh-App-Overview-Audit-Read-files\'"] > visualize > visualization > div > div > div > div > div.metric-value.ng-binding > span').text();
        }, (newVal, oldVal) => {
            if (newVal !== oldVal) {
                $scope.auditReadFiles = newVal;
                if (!$scope.$$phase) $scope.$digest();
            }
        });
    }

    const assignWatcher10 = () => {
        watcher10 = $scope.$watch(() => {
            return $('[vis-id="\'Wazuh-App-Overview-Audit-Modified-files\'"] > visualize > visualization > div > div > div > div > div.metric-value.ng-binding > span').text();
        }, (newVal, oldVal) => {
            if (newVal !== oldVal) {
                $scope.auditModifiedFiles = newVal;
                if (!$scope.$$phase) $scope.$digest();
            }
        });
    }

    const assignWatcher11 = () => {
        watcher11 = $scope.$watch(() => {
            return $('[vis-id="\'Wazuh-App-Overview-Audit-Removed-files\'"] > visualize > visualization > div > div > div > div > div.metric-value.ng-binding > span').text();
        }, (newVal, oldVal) => {
            if (newVal !== oldVal) {
                $scope.auditRemovedFiles = newVal;
                if (!$scope.$$phase) $scope.$digest();
            }
        });
    }


    // Metrics Vulnerability Detector
    let watcher12, watcher13, watcher14, watcher15;

    $scope.vulnCritical = '';
    $scope.vulnHigh     = '';
    $scope.vulnMedium   = '';
    $scope.vulnLow      = '';

    const assignWatcher12 = () => {
        watcher12 = $scope.$watch(() => {
            return $('[vis-id="\'Wazuh-App-Overview-VULS-Metric-Critical-severity\'"] > visualize > visualization > div > div > div > div > div.metric-value.ng-binding > span').text();
        }, (newVal, oldVal) => {
            if (newVal !== oldVal) {
                $scope.vulnCritical = newVal;
                if (!$scope.$$phase) $scope.$digest();
            }
        });
    }
    const assignWatcher13 = () => {
        watcher13 = $scope.$watch(() => {
            return $('[vis-id="\'Wazuh-App-Overview-VULS-Metric-High-severity\'"] > visualize > visualization > div > div > div > div > div.metric-value.ng-binding > span').text();
        }, (newVal, oldVal) => {
            if (newVal !== oldVal) {
                $scope.vulnHigh = newVal;
                if (!$scope.$$phase) $scope.$digest();
            }
        });
    }

    const assignWatcher14 = () => {
        watcher14 = $scope.$watch(() => {
            return $('[vis-id="\'Wazuh-App-Overview-VULS-Metric-Medium-severity\'"] > visualize > visualization > div > div > div > div > div.metric-value.ng-binding > span').text();
        }, (newVal, oldVal) => {
            if (newVal !== oldVal) {
                $scope.vulnMedium = newVal;
                if (!$scope.$$phase) $scope.$digest();
            }
        });
    }

    const assignWatcher15 = () => {
        watcher15 = $scope.$watch(() => {
            return $('[vis-id="\'Wazuh-App-Overview-VULS-Metric-Low-severity\'"] > visualize > visualization > div > div > div > div > div.metric-value.ng-binding > span').text();
        }, (newVal, oldVal) => {
            if (newVal !== oldVal) {
                $scope.vulnLow = newVal;
                if (!$scope.$$phase) $scope.$digest();
            }
        });
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

    const assignOverviewMetrics = () => {
        assignWatcher1();
        assignWatcher2();
        assignWatcher3();
        assignWatcher4();
    }
    const destroyOverviewMetrics = () => {
        watcher1();
        watcher2();
        watcher3();
        watcher4();
        watcher1 = null;
        watcher2 = null;
        watcher3 = null;
        watcher4 = null;
    }

    const assignFimMetrics = () => {
        assignWatcher5();
        assignWatcher6();
        assignWatcher7();
    }

    const destroyFimMetrics = () => {
        watcher5();
        watcher6();
        watcher7();
        watcher5 = null;
        watcher6 = null;
        watcher7 = null;
    }

    const assignAuditMetrics = () => {
        assignWatcher8();
        assignWatcher9();
        assignWatcher10();
        assignWatcher11();
    }

    const destroyAuditMetrics = () => {
        watcher8();
        watcher9();
        watcher10();
        watcher11();
        watcher8 = null;
        watcher9 = null;
        watcher10 = null;
        watcher11 = null;
    }

    const assignVulnMetrics = () => {
        assignWatcher12();
        assignWatcher13();
        assignWatcher14();
        assignWatcher15();
    }

    const destroyVulnMetrics = () => {
        watcher12();
        watcher13();
        watcher14();
        watcher15();
        watcher12 = null;
        watcher13 = null;
        watcher14 = null;
        watcher15 = null;
    }

    if ($scope.tab === 'general' && $scope.tabView === 'panels' && !watcher1) {
        assignOverviewMetrics();
    }

    if ($scope.tab === 'fim' && $scope.tabView === 'panels' && !watcher5) {
        assignOverviewMetrics();
    }

    if ($scope.tab === 'audit' && $scope.tabView === 'panels' && !watcher8) {
        assignAuditMetrics();
    }

    if ($scope.tab === 'vuls' && $scope.tabView === 'panels' && !watcher12) {
        assignVulnMetrics();
    }

    // Switch subtab
    $scope.switchSubtab = subtab => {
        $scope.tabView = subtab;

        if($scope.tab === 'general' && subtab === 'panels' && !watcher1){
            assignOverviewMetrics();
        } else if(watcher1) {
            destroyOverviewMetrics();
        }

        if($scope.tab === 'fim' && subtab === 'panels' && !watcher5){
            assignFimMetrics();
        } else if(watcher5) {
            destroyFimMetrics();
        }

        if($scope.tab === 'audit' && subtab === 'panels' && !watcher8){
            assignAuditMetrics();
        } else if(watcher8) {
            destroyAuditMetrics();
        }
        
        if($scope.tab === 'vuls' && subtab === 'panels' && !watcher12){
            assignVulnMetrics();
        } else if(watcher8) {
            destroyVulnMetrics();
        }

    }
    // Switch tab
    $scope.switchTab = tab => {
        if ($scope.tab === tab) return;

        if(tab === 'general' && $scope.tabView === 'panels' && !watcher1){
            assignOverviewMetrics();
        } else if(watcher1) {
            destroyOverviewMetrics();
        }

        if(tab === 'fim' && $scope.tabView === 'panels' && !watcher5){
            assignFimMetrics();
        } else if(watcher1) {
            destroyFimMetrics();
        }

        if(tab === 'audit' && $scope.tabView === 'panels' && !watcher8){
            assignAuditMetrics();
        } else if(watcher8) {
            destroyAuditMetrics();
        }

        if(tab === 'vuls' && $scope.tabView === 'panels' && !watcher12){
            assignVulnMetrics();
        } else if(watcher8) {
            destroyVulnMetrics();
        }

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
        if(watcher1) destroyOverviewMetrics();
        if(watcher5) destroyFimMetrics();
        if(watcher8) destroyAuditMetrics();
        if(watcher12) destroyVulnMetrics();
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
