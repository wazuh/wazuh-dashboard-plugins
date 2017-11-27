import rison from 'rison-node';

let app = require('ui/modules').get('app/wazuh', []);

app.controller('overviewController', function ($scope, $location, $rootScope, appState, genericReq) {
    $rootScope.page = 'overview';
    $scope.extensions = appState.getExtensions().extensions;

    // Check the url hash and retriew the tabView information 
    if ($location.search().tabView) {
        $scope.tabView = $location.search().tabView;
    } else { // If tabView doesn't exist, default it to 'panels' view
        $scope.tabView = 'panels';
        $location.search('tabView', 'panels');
    }

    // Check the url hash and retrivew the tab information 
    if ($location.search().tab) {
        $scope.tab = $location.search().tab;
    } else { // If tab doesn't exist, default it to 'general' view
        $scope.tab = 'general';
        $location.search('tab', 'general');

        // Now we initialize the implicitFilter
        $rootScope.currentImplicitFilter = "";
    }

    // Object for matching nav items and Wazuh groups
    let tabFilters = {
        "general": {
            "group": ""
        },
        "fim": {
            "group": "syscheck"
        },
        "pm": {
            "group": "rootcheck"
        },
        "oscap": {
            "group": "oscap"
        },
        "audit": {
            "group": "audit"
        },
        "pci": {
            "group": ""
        }
    };

    $scope.hideRing = (items) => {
        return $(".vis-container").length >= items;
    };

    // Switch subtab
    $scope.switchSubtab = (subtab) => {
        $scope.tabView = subtab;
    };

    // Switch tab
    $scope.switchTab = (tab) => {
        // Deleing app state traces in the url
        $location.search('_a', null);
        $scope.tabView = 'panels';
    };

    // Watchers

    // We watch the resultState provided by the discover
    $rootScope.$watch('resultState', () => {
        $scope.resultState = $rootScope.resultState;
    });
    $scope.$watch('tabView', () => $location.search('tabView', $scope.tabView));
    $scope.$watch('tab', () => {
        $location.search('tab', $scope.tab);
        // Update the implicit filter
        if (tabFilters[$scope.tab].group === "") $rootScope.currentImplicitFilter = "";
        else $rootScope.currentImplicitFilter = tabFilters[$scope.tab].group;
    });

    let tabs = [];
    
    genericReq
        .request('GET', '/api/wazuh-api/pci/all')
        .then(data => {
            for(let key in data.data){
                tabs.push({
                    "title":   key,
                    "content": data.data[key]
                });
            }
        });

    $scope.tabs = tabs;
    $scope.selectedIndex = 0;
});
