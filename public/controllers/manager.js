// Require config
let app = require('ui/modules').get('app/wazuh', []);

app.controller('managerController', function ($scope,$rootScope, $routeParams, $location,apiReq, Notifier) {
    const notify = new Notifier({ location: 'Manager' });
    $scope.submenuNavItem  = 'status';
    $scope.submenuNavItem2 = 'rules';

    if ($routeParams.tab){
        $scope.submenuNavItem = $routeParams.tab;
    }
    apiReq.request('GET', `/agents/000`, {})
    .then(data => $rootScope.agent = data.data.data)
    .catch(error => notify.error(error.message));
    // Watchers
    $scope.$watch('submenuNavItem', () => {
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

    //Functions
    $scope.getDaemonStatusClass = (daemonStatus) => { 
        return (daemonStatus === 'running') ? 'status green' : 'status red';
    };

    Promise.all([
        apiReq.request('GET', '/agents/summary', {}),
        apiReq.request('GET', '/manager/status', {}),
        apiReq.request('GET', '/manager/info', {}),
        apiReq.request('GET', '/rules', { offset: 0, limit: 1 }),
        apiReq.request('GET', '/decoders', { offset: 0, limit: 1 })
    ])
    .then(data => {
        $scope.agentsCountActive         = data[0].data.data.Active;
        $scope.agentsCountDisconnected   = data[0].data.data.Disconnected;
        $scope.agentsCountNeverConnected = data[0].data.data['Never connected'];
        $scope.agentsCountTotal          = data[0].data.data.Total;
        $scope.agentsCoverity            = (data[0].data.data.Active / data[0].data.data.Total) * 100;

        $scope.daemons       = data[1].data.data;
        $scope.managerInfo   = data[2].data.data;
        $scope.totalRules    = data[3].data.data.totalItems;
        $scope.totalDecoders = data[4].data.data.totalItems;

        return apiReq.request('GET', '/agents', { limit: 1, sort: '-date_add' });
    })
    .then(lastAgent => apiReq.request('GET', `/agents/${lastAgent.data.data.items[0].id}`, {}))
    .then(agentInfo => {
        $scope.agentInfo = agentInfo.data.data;
        $scope.load = false;
        $scope.$digest();
    })
    .catch(error => notify.error(error.message));

});

const beautifier = require('plugins/wazuh/utils/json-beautifier');
app.controller('managerConfigurationController', function ($scope,$rootScope, Notifier, apiReq) {
    //Initialization
    const notify   = new Notifier({ location: 'Manager - Configuration' });
    $scope.load    = true;
    $scope.isArray = angular.isArray;

    $scope.switchItem = item => {
        $scope.selectedItem = item;
        if(!$scope.$$phase) $scope.$digest();
    }

    //Functions
    const load = async () => {
        try{
            const data = await apiReq.request('GET', '/manager/configuration', {});

            $scope.managerConfiguration = data.data.data;
            $scope.raw = beautifier.prettyPrint(data.data.data);
            $scope.load                 = false;
            if(!$scope.$$phase) $scope.$digest();
            return;
        } catch (error) {
            notify.error(error.message)
        }
    };

    load();

});