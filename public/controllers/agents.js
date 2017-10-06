import rison from 'rison-node';
// Require config
var app = require('ui/modules').get('app/wazuh', []);

app.controller('agentsController', function ($scope, $q, DataFactory, Notifier, appState, errlog, $window, genericReq, $routeParams, $route, $location, $http, $rootScope) {
    //Initialization
    $scope.filters = {"global": {"agent": "", "cluster": ""}}
    $scope.state = appState;
    $scope.load = true;
    $scope.search = '';
    $scope.submenuNavItem = 'preview';
    $rootScope.page = "agents";
    $scope.tabView = "panels";
    $scope._status = 'all';
    $scope._osPlatform = 'all';
    $scope._osVersion = 'all';
    $scope._bulkOperation = 'nothing';
    $scope.cluster_info = $scope.state.getClusterInfo();
    $scope.filters.global.cluster = "AND cluster.name: " + $scope.cluster_info.cluster;

    $scope.extensions = $scope.state.getExtensions().extensions;
    $scope.results = true;
    $scope.loading = true;
    $scope.hideRing = function(items){
        if($(".vis-editor-content" ).length >= items)
            return true;
        return false;
    }
	var objectsArray = [];
	const notify = new Notifier({location: 'Agents'});

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
		$scope.loading=true;
		// Detecting refresh or location
		if($scope.submenuNavItem != tab){
			$scope.submenuNavItem = tab;
			$location.search('tab', $scope.submenuNavItem);
			if($scope.submenuNavItem != "preview"){
				$scope.presentData($scope._agent.id).then(function (data) {$scope.results = data;	$scope.loading = false;}, function() { $scope.results = false; $scope.loading = false;});
			}
		}else{
			$rootScope.$broadcast('fetchVisualization');
			$scope.presentData($scope._agent.id).then(function (data) {$scope.results = data; $scope.loading = false;}, function() { $scope.results = false; $scope.loading = false;});
		}
	};

    //Print Error
    var printError = function (error) {
        notify.error(error.message);
    };

	// Checking for alerts count

	// Decode and set time filter
	if($route.current.params._g){
		var decodedTimeFilter;
		if($route.current.params._g.startsWith("h@")){
			decodedTimeFilter = JSON.parse(sessionStorage.getItem($route.current.params._g));
		}else{
			decodedTimeFilter = rison.decode($route.current.params._g);
		}

		if(decodedTimeFilter.time){
			$scope.timeGTE = decodedTimeFilter.time.from;
			$scope.timeLT = decodedTimeFilter.time.to;
		}else{
			$scope.timeGTE = "now-1d";
			$scope.timeLT = "now";
		}
	}else{
		$scope.timeGTE = "now-1d";
		$scope.timeLT = "now";
	}

	// Check if there are any alert.
	$scope.presentData = function (agent_id) {
		var group = tabGroups[$scope.submenuNavItem].group;
		var payload = {};
		var fields = {"fields" : [{"field": "rule.groups", "value": group},{"field": "agent.id", "value": agent_id}]};
		// No filter needed for general/pci
		if(group == "*")
			fields = {"fields" : [{"field": "agent.id", "value": agent_id}]};
		var clusterName = {"cluster" : $scope.cluster_info.cluster};
		var timeInterval = {"timeinterval": {"gte" : $scope.timeGTE, "lt": $scope.timeLT}};
    
		angular.extend(payload, fields, clusterName, timeInterval);

		var deferred = $q.defer();
        genericReq.request('POST', '/api/wazuh-elastic/alerts-count/', payload).then(function (data) {
			if(data.data != 0)
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
			$scope.load = true;
			if($scope.submenuNavItem == 'preview'){
				$scope.submenuNavItem = 'overview';
				$location.search('tab', $scope.submenuNavItem);
			}
			$scope.agentInfo = {};
			// Get Agent Info
			DataFactory.getAndClean('get', '/agents/' + agent.id, {}).then(function (data) {
				$scope.agentInfo = data.data.data;
				$rootScope.agent = $scope.agentInfo;
				if(angular.isUndefined($scope.agentInfo.version))
					$scope.agentInfo.version = "Unknown";
				if(angular.isUndefined($scope.agentInfo.os)) {
					$scope.agentOs = "Unknown";
				}
				else {
					if(!angular.isUndefined($scope.agentInfo.os.name)) {
						$scope.agentOs = $scope.agentInfo.os.name + ' ' + $scope.agentInfo.os.version;
					}
					else {
						if(!angular.isUndefined($scope.agentInfo.os.uname)){
							$scope.agentOs = $scope.agentInfo.os.uname;
						}
						else {
							$scope.agentOs = "Unknown";
						}
					}
				}
				if(angular.isUndefined($scope.agentInfo.lastKeepAlive))
					$scope.agentInfo.lastKeepAlive = "Unknown";

				$scope._agent = data.data.data;
				$scope.search = data.data.data.name;
				$location.search('id', $scope._agent.id);
				$scope.presentData($scope._agent.id).then(function (data) {
					$scope.results = data;
					$scope.load = false;
				});

				// Get syscheck info
				DataFactory.getAndClean('get', '/syscheck/' + agent.id + '/last_scan', {}).then(function (data) {
					$scope.agentInfo.syscheck = data.data.data;
					$scope.agentInfo.syscheck.duration = "Unknown";
					if($scope.agentInfo.syscheck.end != null && $scope.agentInfo.syscheck.start != null){
						var syscheckTime = new Date($scope.agentInfo.syscheck.start);
						var syscheckEndTime = new Date($scope.agentInfo.syscheck.end);
						var minutes = ((syscheckEndTime-syscheckTime)/1000)/60;
						$scope.agentInfo.syscheck.duration = window.Math.round(minutes);
					}else if($scope.agentInfo.syscheck.end == null){
						$scope.agentInfo.syscheck.end = "Unknown";
					}else{
						$scope.agentInfo.syscheck.start = "Unknown";
					}
				}, printError);

				// Get rootcheck info
				DataFactory.getAndClean('get', '/rootcheck/' + agent.id + '/last_scan', {}).then(function (data) {
					$scope.agentInfo.rootcheck = data.data.data;
					$scope.agentInfo.rootcheck.duration = "Unknown";
					if($scope.agentInfo.rootcheck.end != null && $scope.agentInfo.rootcheck.start != null){
						var rootcheckTime = new Date($scope.agentInfo.rootcheck.start);
						var rootcheckEndTime = new Date($scope.agentInfo.rootcheck.end);
						var minutes = ((rootcheckEndTime-rootcheckTime)/1000)/60;
						$scope.agentInfo.rootcheck.duration = window.Math.round(minutes);
					}else if($scope.agentInfo.rootcheck.end == null){
						$scope.agentInfo.rootcheck.end = "Unknown";
					}else{
						$scope.agentInfo.rootcheck.start = "Unknown";
					}
				}, printError);

			}, printError);
        }
    };


	$scope.restartAgent = function () {
		var path = '/agents/' + $scope._agent.id + '/restart';

		DataFactory.getAndClean('put', path, {})
			.then(function (data) {
				if(data.error == 0)
					notify.info("The agent was successfully restarted");
				else{
					notify.error("The agent was not restarted");
				}


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
			var gParameter;
			if($route.current.params._g.startsWith("h@")){
				gParameter = sessionStorage.getItem($route.current.params._g);
			}else{
				gParameter = $route.current.params._g;
			}
			if(gParameter != "()" && ($scope.timeGTE != currentTimeFilter.time.from || $scope.timeLT != currentTimeFilter.time.to)){
				$scope.timeGTE = currentTimeFilter.time.from;
				$scope.timeLT = currentTimeFilter.time.to;

				//Check for present data for the selected tab
				if($scope.submenuNavItem != "preview"){
					$scope.presentData($scope._agent.id).then(function (data) {$scope.results = data;}, function() { $scope.results = false; });
				}
			}
		}
		// Check if tab is empty, then reset to preview
		if(angular.isUndefined($location.search().tab) && angular.isUndefined($location.search().id)){
			$scope.submenuNavItem = "preview";
			delete $scope._agent;
			$scope.search = "";
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
		$scope.loading=false;
    } catch (e) {
        notify.error('Unexpected exception loading controller');
        errlog.log('Unexpected exception loading controller', e);
    }

    //Destroy
    $scope.$on("$destroy", function () {
        angular.forEach(objectsArray, function (value) {
            DataFactory.clean(value)
        });
    });

});
