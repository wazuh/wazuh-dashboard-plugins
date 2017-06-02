// Require config
var app = require('ui/modules').get('app/wazuh', []);

app.controller('managerController', function ($scope, $route, $routeParams, $location) {

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


app.controller('managerStatusController', function ($scope, DataFactory, genericReq, errlog, Notifier) {
    //Initialization
    var ring = document.getElementsByClassName("uil-ring-css");
    ring[0].style.display="block";
    $scope.load = true;
    $scope.timeFilter = "24h";
	const notify = new Notifier({location: 'Manager - Status'});
    $scope.stats = [];
    $scope.stats['/top/agent'] = '-';
    $scope.stats['/overview/alerts'] = { "alerts": 0, "ip": "-", "group": "-" };
    $scope.stats['/overview/fim'] = { "alerts": 0, "agent": "-", "file": "-" };

    //Print Error
    var printError = function (error) {
		notify.error(error.message);
    };

    //Functions
    $scope.getDaemonStatusClass = function (daemonStatus) {
        if (daemonStatus == "running")
            return "status green"
        else if (daemonStatus == "stopped")
            return "status red";
        else
            return "status red";
    };


    var load = function () {
        DataFactory.getAndClean('get', '/agents/summary', {})
            .then(function (data) {
                $scope.agentsCountActive = data.data.Active;
                $scope.agentsCountDisconnected = data.data.Disconnected;
                $scope.agentsCountNeverConnected = data.data['Never connected'];
                $scope.agentsCountTotal = data.data.Total;
                $scope.agentsCoverity = (data.data.Active / data.data.Total) * 100;
            }, printError);
        DataFactory.getAndClean('get', '/manager/status', {})
            .then(function (data) {
                $scope.daemons = data.data;
            }, printError);
        DataFactory.getAndClean('get', '/manager/info', {})
            .then(function (data) {
                $scope.managerInfo = data.data;
                DataFactory.getAndClean('get', '/rules', { offset: 0, limit: 1 })
                    .then(function (data) {
                        $scope.totalRules = data.data.totalItems;
                        DataFactory.getAndClean('get', '/decoders', { offset: 0, limit: 1 })
                            .then(function (data) {
                                $scope.totalDecoders = data.data.totalItems;
                                $scope.load = false;
                            }, printError);
                    }, printError);
            }, printError);
        DataFactory.getAndClean('get', '/agents', { offset: 0, limit: 1, sort: '-id' })
            .then(function (data) {
                DataFactory.getAndClean('get', '/agents/' + data.data.items[0].id, {})
                    .then(function (data) {
                        $scope.agentInfo = data.data;
                    }, printError);
            }, printError);
    };

    //Load
    try {
        load();
    } catch (e) {
        notify.error("Unexpected exception loading controller");
        errlog.log('Unexpected exception loading controller', e);
    }

    //Destroy
    $scope.$on("$destroy", function () {
        $scope.stats.length = 0;
    });

});

app.controller('managerConfigurationController', function ($scope, DataFactory, errlog, Notifier) {
    //Initialization
    var ring = document.getElementsByClassName("uil-ring-css");
    ring[0].style.display="block";
    $scope.load = true;
	$scope.isArray = angular.isArray;
	const notify = new Notifier({location: 'Manager - Configuration'});
	
    //Print Error
    var printError = function (error) {
        notify.error(error.message);
    };

    //Functions
    var load = function () {
        DataFactory.getAndClean('get', '/manager/status', {})
            .then(function (data) {
                $scope.daemons = data.data;
                DataFactory.getAndClean('get', '/manager/configuration', {})
                    .then(function (data) {
                        $scope.managerConfiguration = data.data;
                        $scope.load = false;
                    }, printError);
            }, printError);
    };

    //Load
    try {
        load();
    } catch (e) {
		notify.error("Unexpected exception loading controller");
        errlog.log('Unexpected exception loading controller', e);
    }

    //Destroy
    $scope.$on("$destroy", function () {
        $scope.managerConfiguration.length = 0;
    });

});
