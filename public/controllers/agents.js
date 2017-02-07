// Require config
var app = require('ui/modules').get('app/wazuh', []);

app.controller('agentsController', function ($scope, $q, DataFactory, $mdToast, appState, errlog, $window, genericReq, $routeParams, $route, $location) {
    //Initialization
	$scope.state = appState;
    $scope.load = true;
    $scope.search = '';
    $scope.submenuNavItem = 'preview';
	$scope.tabView = "panels";	
    $scope.state = appState;
	$scope._status = 'all';

	var agentId = "";
	
	
	if($routeParams.id)
		agentId = $routeParams.id;
    if($routeParams.tab)
		$scope.submenuNavItem = $routeParams.tab;
	if($routeParams.view)
		$scope.tabView  = $routeParams.view;
	
	var objectsArray = [];
	$scope.defaultManager = $scope.state.getDefaultManager().name;
	$scope.extensions = $scope.state.getExtensions().extensions;
	
    //Print Error
    var printError = function (error) {
        $mdToast.show({
            template: '<md-toast>' + error.html + '</md-toast>',
            position: 'bottom left',
            hideDelay: 5000,
        });
    };

	// Watchers
	$scope.$watch('_agent', function() {
		$location.search('id', $scope._agent.id);		
	});
	
	$scope.$watch('tabView', function() {
		$location.search('view', $scope.tabView);		
	});
	
	$scope.$watch('submenuNavItem', function() {
		$location.search('tab', $scope.submenuNavItem);
	});	
	
	
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
	
	$scope.extensionStatus = function (extension) {
		return $scope.extensions[extension];
    };
	
    $scope.applyAgent = function (agent) {
        if (agent) {
			if($scope.submenuNavItem == 'preview')
				$scope.submenuNavItem = 'overview';		
			
			DataFactory.getAndClean('get', '/agents/' + agent.id, {})
			.then(function (data) {
				$scope.agentInfo = data.data;
				$scope._agent = data.data;
				$scope.search = data.data.name;
				$scope.load = false;
			}, printError);
        }
    };


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
				if(agentId != "")
					$scope.applyAgent({"id": agentId});
				else
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
		console.log("destroying");
        angular.forEach(objectsArray, function (value) {
            DataFactory.clean(value)
        });
    });

});