// Require config
var app = require('ui/modules').get('app/wazuh', []);

app.controller('agentsController', function ($scope, $q, DataFactory, $mdToast, appState, errlog, $window, genericReq) {
    //Initialization
	$scope.state = appState;
    $scope.load = true;
    $scope.search = '';
    $scope.submenuNavItem = '';
    $scope.state = appState;
	$scope._status = 'all';
	
	$scope.dynamicTab_fields = {};
    var objectsArray = [];
	$scope.defaultManager = $scope.state.getDefaultManager().name;
	
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

	var daysAgo = 7;
	var date = new Date();
	date.setDate(date.getDate() - daysAgo);
	var timeAgo = date.getTime();
	
	// Function: Check if rule group exists on Elastic cluster latest alerts.
	$scope.dynamicTab_exists = function (group, agentName) {
		genericReq.request('GET', '/api/wazuh-elastic/top/'+$scope.defaultManager+'/rule.groups/rule.groups/'+group+'/agent.name/'+agentName+'/'+timeAgo)
			.then(function (data) {
				console.log(data);
				if(data.data != ""){
					$scope.dynamicTab_fields[group] = true;
				}else{
					$scope.dynamicTab_fields[group] = false
				}
        });	
    };
	
    $scope.applyAgent = function (agent) {
        if (agent) {
			$scope.load = true;
            //$scope.submenuNavItem = 'fim';
            $scope.submenuNavItem = 'overview';
            $scope._agent = agent;
            $scope.search = agent.name;
			
			// Checking dynamic panels
			$scope.dynamicTab_exists("oscap", $scope._agent.name);
			
			$scope.load = false;
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
        DataFactory.initialize('get', '/agents', {}, 5, 0)
            .then(function (data) {
                objectsArray['/agents'] = data;
				DataFactory.filters.register(objectsArray['/agents'], 'search', 'string');
				/* tmp for debugging. Forcing a tab/agent selected.*/
				/*	
					$scope.submenuNavItem = 'oscap';
					DataFactory.getAndClean('get', '/agents/' + "002", {})
					.then(function (data) {
						$scope.agentInfo = data.data;
						$scope._agent = data.data;
						$scope.dynamicTab_exists("oscap", $scope._agent.name);
					}, printError);
				*/
				// close tmp
                $scope.load = false;
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