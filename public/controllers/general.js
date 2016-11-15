// Require config
var app = require('ui/modules').get('app/wazuh', []);

app.controller('generalController', function ($scope, $q, DataFactory, $mdToast, appState, errlog, $window) {
    //Initialisation
    $scope.load = true;
    $scope.search = '';
    $scope.menuNavItem = 'agents';
    $scope.submenuNavItem = '';
    $scope.state = appState;

    var objectsArray = [];

    //Print Error
    var printError = function (error) {
        $mdToast.show({
            template: '<md-toast>' + error.html + '</md-toast>',
            position: 'bottom left',
            hideDelay: 5000,
        });
    };

    //Functions

    $scope.getAgentStatusClass = function (agentStatus) {
        if (agentStatus == "Active")
            return "green"
        else
            return "red";
    };

    $scope.formatAgentStatus = function (agentStatus) {
        if (agentStatus == "Active")
            return "Active"
        else if (agentStatus == "Disconnected")
            return "Disconnected";
        else
            return "Never connected";
    };

    $scope.agentsSearch = function (search) {
        var defered = $q.defer();
        var promise = defered.promise;

        if (search) {
            DataFactory.filters.set(objectsArray['/agents'], 'search', search);
        } else {
            DataFactory.filters.unset(objectsArray['/agents'], 'search');
        }

        DataFactory.get(objectsArray['/agents'])
            .then(function (data) {
                defered.resolve(data.data.items);
            }, function (data) {
                printError(data);
                defered.reject();
            });
        return promise;
    };

    $scope.applyAgent = function (agent) {
        if (agent) {
            $scope.submenuNavItem = 'fim';
            $scope._agent = agent;
            $scope.search = agent.name;
        }
    };
	
	
    $scope.openDashboard = function (dashboard, filter) {
        $scope.state.setDashboardsState(dashboard, filter);
		$window.location.href = '#/dashboards/';
    }
	
	$scope.openDiscover = function (template, filter) {
        $scope.state.setDiscoverState(template, filter);
		$window.location.href = '#/discover/';
    }
	$scope.resetDiscover = function () {
        $scope.state.unsetDiscoverState();
    }
	$scope.resetDashboards = function () {
        $scope.state.unsetDashboardsState();
    }	
	
	$scope.restartAgent = function () {
		var path = '/agents/' + $scope._agent.id + '/restart';

		DataFactory.getAndClean('put', path, {})
			.then(function (data) {
				if(data.error != 0)
					var alert = data.message;
				else
					var alert = data.data;
				
				$mdToast.show({
					template: '<md-toast>' + alert + '</md-toast>',
					position: 'bottom left',
					hideDelay: 2000,
				});
				
			}, printError);
	};
	
	
    var load = function () {
        DataFactory.initialize('get', '/agents', {}, 256, 0)
            .then(function (data) {
                objectsArray['/agents'] = data;
				// tmp
				     DataFactory.get(objectsArray['/agents'])
					.then(function (data) {
						$scope.submenuNavItem = 'fim';
						$scope._agent = data.data.items[0];
						$scope.search = data.data.items[0].name;
						 $scope.load = false;
					}, function (data) {
						printError(data);
						//defered.reject();
					});

				// tmp
                DataFactory.get(data).then(function (data) {
                    DataFactory.filters.register(objectsArray['/agents'], 'search', 'string');
                    $scope.load = false;
                }, printError);
            }, printError);
    };

    //Load
    try {
        load();
    } catch (e) {
        $mdToast.show({
            template: '<md-toast> Unexpected exception loading controller </md-toast>',
            position: 'bottom left',
            hideDelay: 5000,
        });
        errlog.log('Unexpected exception loading controller', e);
    }

    //Destroy
    $scope.$on("$destroy", function () {
        angular.forEach(objectsArray, function (value) {
            DataFactory.clean(value)
        });
    });

});

app.controller('stateController', function ($scope, appState, $route) {
    $scope.state = appState;
    $scope.select = $route.current.params.select;
	$scope.submenuNavItem2 = "rules";
	$scope.resetDiscover = function () {
        $scope.state.unsetDiscoverState();
    }
	$scope.resetDashboards = function () {
        $scope.state.unsetDashboardsState();
    }
	
	$scope.setRulesTab = function(tab) {
		$scope.submenuNavItem2 = tab;
	};

});

app.controller('stateLocationController', function ($scope, appState, $window) {
    $scope.state = appState;

    $scope.openDashboard = function (dashboard, filter) {
        $scope.state.setDashboardsState(dashboard, filter);
		$window.location.href = '#/dashboards/';
		
    }
	$scope.openDiscover = function (template, filter) {
        $scope.state.setDiscoverState(template, filter);
		$window.location.href = '#/discover/';
    }
	$scope.resetDiscover = function () {
        $scope.state.unsetDiscoverState();
    }
	$scope.resetDashboards = function () {
        $scope.state.unsetDashboardsState();
    }	
	

});