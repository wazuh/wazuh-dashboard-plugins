// Require config
var app = require('ui/modules').get('app/wazuh', []);

app.controller('managerController', function ($scope, $routeParams, $location) {
	$scope.submenuNavItem = "status";
	$scope.submenuNavItem2 = "rules";

	if($routeParams.tab)
		$scope.submenuNavItem = $routeParams.tab;
	
	// Watchers
	$scope.$watch('submenuNavItem', function() {
		$location.search('tab', $scope.submenuNavItem);		
	});
	
	$scope.setRulesTab = function(tab) {
		$scope.submenuNavItem2 = tab;
	};
});

app.controller('managerStatusController', function ($scope, Notifier, apiReq) {
    //Initialization
    const notify = new Notifier({ location: 'Manager - Status' });
    $scope.load = true;

    //Print Error
    var printError = function (error) {
		notify.error(error.message);
    };

    //Functions
    $scope.getDaemonStatusClass = function (daemonStatus) {
        if (daemonStatus == "running")
            return "status green"
        else
            return "status red";
    };

    var load = function () {
        apiReq.request('GET', '/agents/summary', {}).then(function (data) {
            $scope.agentsCountActive = data.data.data.Active;
            $scope.agentsCountDisconnected = data.data.data.Disconnected;
            $scope.agentsCountNeverConnected = data.data.data['Never connected'];
            $scope.agentsCountTotal = data.data.data.Total;
            $scope.agentsCoverity = (data.data.data.Active / data.data.data.Total) * 100;
        }, printError);

        apiReq.request('GET', '/manager/status', {}).then(function (data) {
            $scope.daemons = data.data.data;
        }, printError);

        apiReq.request('GET', '/manager/info', {}).then(function (data) {
            $scope.managerInfo = data.data.data;
            apiReq.request('GET', '/rules', { offset: 0, limit: 1 }).then(function (data) {
                $scope.totalRules = data.data.data.totalItems;
                apiReq.request('GET', '/decoders', { offset: 0, limit: 1 }).then(function (data) {
                    $scope.totalDecoders = data.data.data.totalItems;
                    $scope.load = false;
                }, printError);
            }, printError);
        }, printError);

        apiReq.request('GET', '/agents', { offset: 0, limit: 1, sort: '-id' }).then(function (data) {
            apiReq.request('GET', '/agents/' + data.data.data.items[0].id, {}).then(function (data) {
                $scope.agentInfo = data.data.data;
            }, printError);
        }, printError);
    };

    //Load
    try {
        load();
    } catch (e) {
        notify.error("Unexpected exception loading controller");
    }
});

app.controller('managerConfigurationController', function ($scope, Notifier, apiReq) {
    //Initialization
    const notify = new Notifier({ location: 'Manager - Configuration' });
    $scope.load = true;
	$scope.isArray = angular.isArray;
	
    //Print Error
    var printError = function (error) {
        notify.error(error.message);
    };

    //Functions
    var load = function () {
        apiReq.request('GET', '/manager/status', {}).then(function (data) {
            $scope.daemons = data.data.data;
            apiReq.request('GET', '/manager/configuration', {}).then(function (data) {
                $scope.managerConfiguration = data.data.data;
                $scope.load = false;
            }, printError);
        }, printError);
    };

    //Load
    try {
        load();
    } catch (e) {
		notify.error("Unexpected exception loading controller");
    }
});
