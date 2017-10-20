import rison from 'rison-node';
// Require config
var app = require('ui/modules').get('app/wazuh', []);

// We are using the DataHandler template and customize its path to get information about agents
app.factory('AgentsAutoComplete', function(DataHandler) {
	var AgentsAutoComplete = new DataHandler();
	AgentsAutoComplete.path = '/agents';
	return AgentsAutoComplete;
});

app.controller('agentsController', function ($scope, $q, $routeParams, $route, $location, $rootScope, Notifier, appState, genericReq, apiReq, AgentsAutoComplete) {
	const notify = new Notifier({location: 'Agents'});
    $rootScope.page = "agents";
    $scope.submenuNavItem = 'preview';

    $scope.agentsAutoComplete = AgentsAutoComplete;

	if ($location.search().tabView)
		$scope.tabView = $location.search().tabView;
	else {
		$scope.tabView = "panels";
		$location.search("tabView", "panels");
	}

    $scope.hideRing = function(items) {
        if($(".vis-editor-content" ).length >= items)
            return true;
        return false;
    }

	// Object for matching nav items and Wazuh groups
	var tabGroups = { "overview": {"group": "*"}, "fim": {"group": "syscheck"}, "policy_monitoring": {"group": "rootcheck"}, "oscap": {"group": "oscap"}, "audit": {"group": "audit"}, "pci": {"group": "*"}};

	$scope.switchTab = function (tab) {
		$scope.loading = true;
		$scope.submenuNavItem = tab;
		$scope.checkAlerts($scope._agent.id).then(function (data) { $scope.results = data;	$scope.loading = false; }, function() { $scope.results = false; $scope.loading = false; });
	};

    //Print Error
    var printError = function (error) {
        notify.error(error.message);
    };

	// Check if there are any alert.
	$scope.checkAlerts = function (agent_id) {
		var group = tabGroups[$scope.submenuNavItem].group;
		var payload = {};
		var fields = {"fields" : [{"field": "rule.groups", "value": group},{"field": "agent.id", "value": agent_id}]};
		// No filter needed for general/pci
		if(group == "*")
			fields = {"fields" : [{"field": "agent.id", "value": agent_id}]};
		var clusterName = {"cluster" : appState.getClusterInfo().cluster};
		var timeInterval = {"timeinterval": {"gte" : $scope.timeGTE, "lt": $scope.timeLT}};
		angular.extend(payload, fields, clusterName, timeInterval);

		var deferred = $q.defer();
        genericReq.request('POST', '/api/wazuh-elastic/alerts-count/', payload).then(function (data) {
			if(data.data.data != 0)
				deferred.resolve(true);
			else
				deferred.resolve(false);
		});
		return deferred.promise;
	};

    $scope.getAgentStatusClass = function (agentStatus) {
        agentStatus == "Active" ? "green" : "red";
    };

    $scope.formatAgentStatus = function (agentStatus) {
        if (agentStatus != "Active" || agentStatus == "Disconnected")
            return "Never connected";
        else return agentStatus;
    };

	$scope.extensionStatus = function (extension) {
		return appState.getExtensions().extensions[extension];
    };

    $scope.applyAgent = function (agent) {
        if (agent) {
			$scope.loading = true;
			$scope.submenuNavItem = 'overview';

			$scope.agentInfo = {};
			// Get Agent Info
			apiReq.request('GET', '/agents/' + agent.id, {}).then(function (data) {
				console.log(data);
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
				$scope.checkAlerts($scope._agent.id).then(function (data) {
					$scope.results = data;
					$scope.loading = false;
				});

				apiReq.request('GET', '/syscheck/' + agent.id + '/last_scan', {}).then(function (data) {
					$scope.agentInfo.syscheck = data.data.data;
					$scope.agentInfo.syscheck.duration = "Unknown";
					if($scope.agentInfo.syscheck.end != null && $scope.agentInfo.syscheck.start != null) {
						var syscheckTime = new Date($scope.agentInfo.syscheck.start);
						var syscheckEndTime = new Date($scope.agentInfo.syscheck.end);
						var minutes = ((syscheckEndTime-syscheckTime)/1000)/60;
						$scope.agentInfo.syscheck.duration = window.Math.round(minutes);
					}else if($scope.agentInfo.syscheck.end == null) {
						$scope.agentInfo.syscheck.end = "Unknown";
					}else {
						$scope.agentInfo.syscheck.start = "Unknown";
					}
				}, printError);

				// Get rootcheck info
				apiReq.request('GET', '/rootcheck/' + agent.id + '/last_scan', {}).then(function (data) {
					$scope.agentInfo.rootcheck = data.data.data;
					$scope.agentInfo.rootcheck.duration = "Unknown";
					if($scope.agentInfo.rootcheck.end != null && $scope.agentInfo.rootcheck.start != null) {
						var rootcheckTime = new Date($scope.agentInfo.rootcheck.start);
						var rootcheckEndTime = new Date($scope.agentInfo.rootcheck.end);
						var minutes = ((rootcheckEndTime-rootcheckTime)/1000)/60;
						$scope.agentInfo.rootcheck.duration = window.Math.round(minutes);
					}else if($scope.agentInfo.rootcheck.end == null) {
						$scope.agentInfo.rootcheck.end = "Unknown";
					}else {
						$scope.agentInfo.rootcheck.start = "Unknown";
					}
				}, printError);
			}, printError);
        }
    };

	// Watchers
	$scope.$watch('tabView', function() {
		$location.search('tabView', $scope.tabView);
	});

	// Watch for timefilter changes
	$scope.$on('$routeUpdate', function() {
		if($location.search()._g && $location.search()._g != "()") {
			var currentTimeFilter = rison.decode($location.search()._g);
			// Check if timefilter has changed and update values
			var gParameter;
			if($route.current.params._g.startsWith("h@")) {
				gParameter = sessionStorage.getItem($route.current.params._g);
			}else {
				gParameter = $route.current.params._g;
			}
			if(gParameter != "()" && ($scope.timeGTE != currentTimeFilter.time.from || $scope.timeLT != currentTimeFilter.time.to)) {
				$scope.timeGTE = currentTimeFilter.time.from;
				$scope.timeLT = currentTimeFilter.time.to;

				//Check for present data for the selected tab
				if($scope.submenuNavItem != "preview") {
					$scope.checkAlerts($scope._agent.id).then(function (data) { $scope.results = data; }, function() { $scope.results = false; });
				}
			}
		}
		// Check if tab is empty, then reset to preview
		if(angular.isUndefined($location.search().tab) && angular.isUndefined($location.search().id)) {
			$scope.submenuNavItem = "preview";
			delete $scope._agent;
			$scope.search = "";
		}
	});

    //Load
    try {
        $scope.agentsAutoComplete.nextPage('').then(function (data) {
			$scope.loading = false;
        });
    } catch (e) {
        notify.error('Unexpected exception loading controller');
    }

    //Destroy
    $scope.$on("$destroy", function () {
    	$scope.agentsAutoComplete.reset();
    });
});

app.controller('agentsOverviewController', function ($scope) {
});

app.controller('fimController', function ($scope) {
    $scope._fimEvent = 'all'
}); 

app.controller('pmController', function ($scope) {
});

app.controller('auditController', function ($scope) {
}); 

app.controller('oscapController', function ($scope) {
});

app.controller('PCIController', function ($scope, genericReq) {
	var tabs = [];
	genericReq.request('GET', '/api/wazuh-api/pci/all').then(function (data) {
		angular.forEach(data.data, function(value, key) {
			tabs.push({"title": key, "content": value});
		});

	});

	$scope.tabs = tabs;
    $scope.selectedIndex = 0;

    $scope.addTab = function (title, view) {
      view = view || title + " Content View";
      tabs.push({ title: title, content: view, disabled: false});
    };

    $scope.removeTab = function (tab) {
      var index = tabs.indexOf(tab);
      tabs.splice(index, 1);
    };
});

