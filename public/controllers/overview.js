let app = require('ui/modules').get('app/wazuh', []);

app.controller('overviewController', function ($scope, $location, $rootScope, appState, genericReq,Notifier) {
    const notify = new Notifier({ location: 'Overview' });
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
            "group": "pci_dss"
        }
    };

    // Switch subtab
    $scope.switchSubtab = (subtab) => {
        $scope.tabView = subtab;
    };

    // Switch tab
    $scope.switchTab = (tab) => {
        if($scope.tab === tab) return;

        for(let h of $rootScope.ownHandlers){
            h._scope.$destroy();
        }
        $rootScope.ownHandlers = [];
        // Deleting app state traces in the url
        $location.search('_a', null);
        $scope.tabView = 'panels';
    };

    $scope.$on('$destroy',() => {
        for(let h of $rootScope.ownHandlers){
            h._scope.$destroy();
        }
        $rootScope.ownHandlers = [];
    });

    // Watchers

    // We watch the resultState provided by the discover
    $scope.$watch('tabView', () => $location.search('tabView', $scope.tabView));
    $scope.$watch('tab', () => {
        $location.search('tab', $scope.tab);
        // Update the implicit filter
        if (tabFilters[$scope.tab].group === "") $rootScope.currentImplicitFilter = "";
        else $rootScope.currentImplicitFilter = tabFilters[$scope.tab].group;
    });

    //PCI tab
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
        })
        .catch(error => notify.error(error.message));

    $scope.tabs = tabs;
    $scope.selectedIndex = 0;
});
