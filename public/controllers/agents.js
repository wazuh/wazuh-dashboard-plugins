// Require config
var app = require('ui/modules').get('app/wazuh', []);

app.controller('agentsController', function ($scope, $q, DataFactory, $mdToast, appState, errlog, $window, genericReq, $routeParams, $route, $location) {
    //Initialization
	$scope.state = appState;
    $scope.load = true;
    $scope.search = '';
    $scope.submenuNavItem = 'preview';
    $scope.state = appState;
	$scope._status = 'all';
	
	var agentId = "";
	var tab = "";
	if($routeParams.id)
		agentId = $routeParams.id;
    if($routeParams.tab)
		tab = $routeParams.tab;
	
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

    //Functions

	// Listen for route change, reset to agents preview
	$scope.$on('$routeUpdate', function(){
		if(!$routeParams.id && !$routeParams.tab){
			delete $scope._agent;
			delete $scope.agentInfo;
			 $scope.submenuNavItem = 'preview';
		}
	});

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
            $scope.submenuNavItem = 'overview';
            $scope._agent = agent;
            $scope.search = agent.name;	
			$location.search('id', agent.id);
			$location.search('tab', "overview");
			$scope.load = false;
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
				if(agentId != ""){
					DataFactory.getAndClean('get', '/agents/' + agentId, {})
					.then(function (data) {
						$scope.submenuNavItem = 'overview';
						if(tab != "")
							$scope.submenuNavItem = tab;
						$scope.agentInfo = data.data;
						$scope._agent = data.data;
						$scope.load = false;
					}, printError);
				}else
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