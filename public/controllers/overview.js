let app = require('ui/modules').get('app/wazuh', []);

app.controller('overviewController', function ($scope, $location, $rootScope, appState, genericReq, errorHandler) {
    $rootScope.page = 'overview';
    $scope.extensions = appState.getExtensions().extensions;

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
        general   : 15,
        fim       : 17,
        pm        : 5,
        vuls      : 8,
        oscap     : 14,
        audit     : 16,
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

    // Switch subtab
    $scope.switchSubtab = subtab => $scope.tabView = subtab;

    // Switch tab
    $scope.switchTab = tab => {
        if($scope.tab === tab) return;

        for(let h of $rootScope.ownHandlers){
            h._scope.$destroy();
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

    $scope.$on('$destroy',() => {
        if($rootScope.ownHandlers){
            for(let h of $rootScope.ownHandlers){
                h._scope.$destroy();
            }
        }
        $rootScope.ownHandlers = [];
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
        .catch(error => {
            errorHandler.handle(error,'Overview');
            if(!$rootScope.$$phase) $rootScope.$digest();
        });

    $scope.tabs = tabs;
    $scope.selectedIndex = 0;
});
