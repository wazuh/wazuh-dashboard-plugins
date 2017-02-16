import rison from 'rison-node';
// Require config
var app = require('ui/modules').get('app/wazuh', []);

app.controller('agentsController', function ($scope, $q, DataFactory, $mdToast, appState, errlog, $window, genericReq, $routeParams, $route, $location, $http, $rootScope) {
    //Initialization
	$scope.state = appState;
    $scope.load = true;
    $scope.search = '';
    $scope.submenuNavItem = 'preview';
	$scope.tabView = "panels";	
    $scope.state = appState;
	$scope._status = 'all';
	$scope.defaultManager = $scope.state.getDefaultManager().name;
	$scope.extensions = $scope.state.getExtensions().extensions;
	$scope.results = false;
	var objectsArray = [];
	
	var agentId = "";	
	// Object for matching nav items and Wazuh groups
	var tabGroups = {
		"overview": {"group": "*"},
		"fim": {"group": "syscheck"},
		"policy_monitoring": {"group": "rootcheck"},
		"oscap": {"group": "oscap"},
		"audit": {"group": "audit"},
		"pci": {"group": "*"}
	};
	
	if($routeParams.id)
		agentId = $routeParams.id;
    if($routeParams.tab)
		$scope.submenuNavItem = $routeParams.tab;
	if($routeParams.view)
		$scope.tabView  = $routeParams.view;
	
	
	//Functions
	
	// Switch tab: Refresh or change location and check for present data
	$scope.switchTab = function (tab) {
		// Detecting refresh or location
		if($scope.submenuNavItem != tab){
			$scope.submenuNavItem = tab;
			$location.search('tab', $scope.submenuNavItem);
			if($scope.submenuNavItem != "preview"){
				$scope.presentData($scope._agent.name).then(function (data) {$scope.results = data;});
			}
		}else{
			$rootScope.$broadcast('fetchVisualization');
			$scope.presentData($scope._agent.name).then(function (data) {$scope.results = data;});
		}
	};
	
    //Print Error
    var printError = function (error) {
        $mdToast.show({
            template: '<md-toast>' + error.html + '</md-toast>',
            position: 'bottom left',
            hideDelay: 5000,
        });
    };

	// Checking for alerts count
	
	// Get current time filter or default
	$scope.timeGTE = ($route.current.params._g && $route.current.params._g != "()") ? rison.decode($route.current.params._g).time.from : "now-1d";
	$scope.timeLT = ($route.current.params._g && $route.current.params._g != "()") ? rison.decode($route.current.params._g).time.to : "now";

	// Check if there are any alert. 
	$scope.presentData = function (agentName) {
		var group = tabGroups[$scope.submenuNavItem].group;
		var payload = {};
		var fields = {"fields" : [{"field": "rule.groups", "value": group},{"field": "agent.name", "value": agentName}]};
		// No filter needed for general/pci
		if(group == "*")
			fields = {"fields" : [{"field": "agent.name", "value": agentName}]};
		var managerName = {"manager" : $scope.defaultManager};
		var timeInterval = {"timeinterval": {"gte" : $scope.timeGTE, "lt": $scope.timeLT}};
		angular.extend(payload, fields, managerName, timeInterval);
		
		var deferred = $q.defer();
		$http.post('/api/wazuh-elastic/alerts-count/', payload).then(function (data) {
			if(data.data.data != 0)
				deferred.resolve(true);
			else
				deferred.resolve(false);
		});
		return deferred.promise;
	};

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
			if($scope.submenuNavItem == 'preview'){
				$scope.submenuNavItem = 'overview';		
				$location.search('tab', $scope.submenuNavItem);
			}
			
			DataFactory.getAndClean('get', '/agents/' + agent.id, {})
			.then(function (data) {
				$scope.agentInfo = data.data;
				$scope._agent = data.data;
				$scope.search = data.data.name;
				$location.search('id', $scope._agent.id);
				$scope.presentData($scope._agent.name).then(function (data) {
					$scope.results = data;
					$scope.load = false;
				});
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

	// Watchers
	$scope.$watch('tabView', function() {
		$location.search('view', $scope.tabView);		
	});
	
	// Watch for timefilter changes
	$scope.$on('$routeUpdate', function(){
		if($location.search()._g && $location.search()._g != "()"){
			var currentTimeFilter = rison.decode($location.search()._g);
			// Check if timefilter has changed and update values
			if($route.current.params._g != "()" && ($scope.timeGTE != currentTimeFilter.time.from || $scope.timeLT != currentTimeFilter.time.to)){
				$scope.timeGTE = currentTimeFilter.time.from;
				$scope.timeLT = currentTimeFilter.time.to;
				
				//Check for present data for the selected tab
				if($scope.submenuNavItem != "preview"){
					$scope.presentData($scope._agent.name).then(function (data) {$scope.results = data;});
				}
			}
		}
		// Check if tab is empty, then reset to preview
		if(angular.isUndefined($location.search().tab) && angular.isUndefined($location.search().id)){
			$scope.submenuNavItem = "preview";
			delete $scope._agent;
		}
	});
	
    var load = function () {
        DataFactory.initialize('get', '/agents', {}, 5, 0)
            .then(function (data) {
                objectsArray['/agents'] = data;
				DataFactory.filters.register(objectsArray['/agents'], 'search', 'string');
				if(agentId != ""){
					$scope.applyAgent({"id": agentId});
				}
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
        angular.forEach(objectsArray, function (value) {
            DataFactory.clean(value)
        });
    });

});