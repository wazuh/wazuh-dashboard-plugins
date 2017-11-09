// Require config
let app = require('ui/modules').get('app/wazuh', []);

app.controller('managerController', function ($scope,$rootScope, $routeParams, $location,apiReq) {
    $scope.submenuNavItem  = 'status';
    $scope.submenuNavItem2 = 'rules';

    if ($routeParams.tab){
        $scope.submenuNavItem = $routeParams.tab;
    }
    apiReq.request('GET', `/agents/000`, {})
    .then(data => $rootScope.agent = data.data.data);
    // Watchers
    $scope.$watch('submenuNavItem', () => {
        console.log(`submenuNavItem: ${$scope.submenuNavItem}`)
        if($scope.submenuNavItem === 'ruleset') {
            $rootScope.globalRuleSet = 'ruleset';
            $rootScope.globalsubmenuNavItem2 = $scope.submenuNavItem2;
        } else {
            delete $rootScope.globalRuleSet;
            delete $rootScope.globalsubmenuNavItem2;
        }
        $location.search('tab', $scope.submenuNavItem);
    });

    $scope.setRulesTab = (tab) => $scope.submenuNavItem2 = tab;
});

app.controller('managerStatusController', function ($scope,$rootScope, Notifier, apiReq) {
    //Initialization
    const notify = new Notifier({ location: 'Manager - Status' });
    $scope.load  = true;

    //Print Error
    const printError = (error) => notify.error(error.message);

    //Functions
    $scope.getDaemonStatusClass = (daemonStatus) => { 
        return (daemonStatus === 'running') ? 'status green' : 'status red';
    };

    const load = () => {
        apiReq
        .request('GET', '/agents/summary', {})
        .then((data) => {
            $scope.agentsCountActive         = data.data.data.Active;
            $scope.agentsCountDisconnected   = data.data.data.Disconnected;
            $scope.agentsCountNeverConnected = data.data.data['Never connected'];
            $scope.agentsCountTotal          = data.data.data.Total;
            $scope.agentsCoverity            = (data.data.data.Active / data.data.data.Total) * 100;
        })
        .catch((error) => printError(error));

        apiReq
        .request('GET', '/manager/status', {})
        .then((data) => $scope.daemons = data.data.data)
        .catch((error) => printError(error));

        apiReq
        .request('GET', '/manager/info', {})
        .then((data) => {
            $scope.managerInfo = data.data.data;
            return apiReq.request('GET', '/rules', {
                offset: 0,
                limit:  1
            });
        })
        .then((data) => {
            $scope.totalRules = data.data.data.totalItems;
            return apiReq.request('GET', '/decoders', {
                offset: 0,
                limit:  1
            });            
        })
        .then((data) => {
            $scope.totalDecoders = data.data.data.totalItems;
            $scope.load          = false;
        })
        .catch((error) => printError(error));

        apiReq.request('GET', '/agents', {
            offset: 0,
            limit:  1,
            sort:   '-id'
        })
        .then((data) => apiReq.request('GET', `/agents/${data.data.data.items[0].id}`, {}))
        .then((data) => $scope.agentInfo = data.data.data)
        .catch((error) => printError(error));
    };

    //Load
    try {
        load();
    } catch (e) {
        notify.error("Unexpected exception loading controller");
    }
});

app.controller('managerConfigurationController', function ($scope,$rootScope, Notifier, apiReq) {
    //Initialization
    const notify   = new Notifier({ location: 'Manager - Configuration' });
    $scope.load    = true;
    $scope.isArray = angular.isArray;

    //Print Error
    const printError = (error) => notify.error(error.message);

    //Functions
    const load = () => {
        apiReq
        .request('GET', '/manager/status', {})
        .then((data) => {
            $scope.daemons = data.data.data;
            return apiReq.request('GET', '/manager/configuration', {});
        })
        .then((data) => {
            $scope.managerConfiguration = data.data.data;
            $scope.load = false;
        })
        .catch((error) => printError(error));
    };

    //Load
    try {
        load();
    } catch (e) {
        notify.error("Unexpected exception loading controller");
    }
});