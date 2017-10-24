import rison from 'rison-node';

var app = require('ui/modules').get('app/wazuh', []).controller('overviewController', function ($scope, $q, $routeParams, $route, $location, $rootScope, appState, genericReq) {

	$rootScope.page = "overview";
	$scope.submenuNavItem = "general";
	$scope.extensions = appState.getExtensions().extensions;

	if ($location.search().tabView)
		$scope.tabView = $location.search().tabView;
	else {
		$scope.tabView = "panels";
		$location.search("tabView", "panels");
	}

	$scope.timeGTE = "now-1d";
	$scope.timeLT = "now";

	// Object for matching nav items and Wazuh groups
	var tabGroups = { "general": {"group": "*"}, "fim": {"group": "syscheck"}, "pm": {"group": "rootcheck"}, "oscap": {"group": "oscap"}, "audit": {"group": "audit"}, "pci": {"group": "*"} };

    $scope.hideRing = function(items) {
        if($(".vis-editor-content" ).length >= items)
            return true;
        return false;
    }

	// Switch tab
	$scope.switchTab = function (tab) {
		$scope.loading = true;
		$scope.submenuNavItem = tab;
		$scope.checkAlerts().then(function (data) { $scope.results = data; $scope.loading = false; }, function(){ $scope.results = false; $scope.loading = false; });
	};

	// Check if there are alerts.
	$scope.checkAlerts = function () {
		var group = tabGroups[$scope.submenuNavItem].group;
		var payload = {};
		var fields = {"fields" : [{"field": "rule.groups", "value": group}]};
		// No filter needed for general/pci
		if(group == "*")
			fields = {"fields" : []};
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

	// Watch for timefilter changes
	$scope.$on('$routeUpdate', function() {
		if($location.search()._g && $location.search()._g != "()") {
			var currentTimeFilter = rison.decode($location.search()._g);
			// Check if timefilter has changed and update values
			if(currentTimeFilter.time && ($scope.timeGTE != currentTimeFilter.time.from || $scope.timeLT != currentTimeFilter.time.to)) {
				$scope.timeGTE = currentTimeFilter.time.from;
				$scope.timeLT = currentTimeFilter.time.to;
				$scope.checkAlerts().then(function (data) {$scope.results = data;}, function(){	$scope.results = false;});
			}
		}
	});

	// Watchers
	$scope.$watch('tabView', function() {
		$location.search('tabView', $scope.tabView);
	});

	// Check alerts
	$scope.checkAlerts().then(function (data) {$scope.results = data; $scope.loading = false;}, function(){	$scope.results = false; $scope.loading = false;});
});

app.controller('overviewGeneralController', function ($scope, appState) {
	appState.setOverviewState('general');
});

app.controller('overviewFimController', function ($scope, appState) {
	appState.setOverviewState('fim');
});

app.controller('overviewPMController', function ($scope, appState) {
    appState.setOverviewState('pm');
});

app.controller('overviewOSCAPController', function ($scope, appState) {
    appState.setOverviewState('oscap');
});

app.controller('overviewAuditController', function ($scope, appState) {
    appState.setOverviewState('audit');
});

app.controller('overviewPCIController', function ($scope, genericReq, appState) {
    appState.setOverviewState('pci');

	var tabs = [];
	genericReq.request('GET', '/api/wazuh-api/pci/all').then(function (data) {
		angular.forEach(data.data, function(value, key) {
			tabs.push({"title": key, "content": value});
		});

	});

	$scope.tabs = tabs;
    $scope.selectedIndex = 0;
});