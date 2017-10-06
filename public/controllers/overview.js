import rison from 'rison-node';
var app = require('ui/modules').get('app/wazuh', []);

app.controller('overviewController', function ($scope, appState, $window, genericReq, $q, $routeParams, $route, $location, $http, $rootScope) {

    $scope.state = appState;
	$scope.cluster_info = $scope.state.getClusterInfo();
	$scope.extensions = $scope.state.getExtensions().extensions;
	$scope.submenuNavItem = "general";
	$scope.tabView = "panels";
  $rootScope.page = "overview";
	$scope.results = true;
	$scope.loading = true;
    $scope.hideRing = function(items){
        if($(".vis-editor-content" ).length >= items)
            return true;
        return false;
    }
	var tab = "";
	var view = "";
	// Object for matching nav items and Wazuh groups
	var tabGroups = {
		"general": {"group": "*"},
		"fim": {"group": "syscheck"},
		"pm": {"group": "rootcheck"},
		"oscap": {"group": "oscap"},
		"audit": {"group": "audit"},
		"pci": {"group": "*"}
	};

    if($routeParams.tab)
		$scope.submenuNavItem  = $routeParams.tab;

	if($routeParams.view)
		$scope.tabView  = $routeParams.view;

	// Functions

    $scope.openDashboard = function (dashboard, filter) {
        $scope.state.setDashboardsState(dashboard, filter);
		$window.location.href = '#/dashboards/';

    }
	$scope.openDiscover = function (template, filter) {
        $scope.state.setDiscoverState(template, filter);
		$window.location.href = '#/discover/';
    }

	$scope.extensionStatus = function (extension) {
		return $scope.extensions[extension];
    };


	// Switch tab: Refresh or change location and check for present data
	$scope.switchTab = function (tab) {
		$scope.loading = true;
		// Detecting refresh or location
		if($scope.submenuNavItem != tab){
			$scope.submenuNavItem = tab;
			$location.search('tab', $scope.submenuNavItem);
			$scope.presentData().then(function (data) {$scope.results = data; $scope.loading=false;}, function(){ $scope.results = false; $scope.loading=false;});
		}else{
			$scope.presentData().then(function (data) {$scope.results = data; $scope.loading=false;}, function(){ $scope.results = false; $scope.loading=false;});
			$rootScope.$broadcast('fetchVisualization');
		}
	};

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
	$scope.presentData = function () {
		var group = tabGroups[$scope.submenuNavItem].group;
		var payload = {};
		var fields = {"fields" : [{"field": "rule.groups", "value": group}]};
		// No filter needed for general/pci
		if(group == "*")
			fields = {"fields" : []};
		var clusterName = {"cluster" : $scope.cluster_info.cluster};
		var timeInterval = {"timeinterval": {"gte" : $scope.timeGTE, "lt": $scope.timeLT}};
		angular.extend(payload, fields, clusterName, timeInterval);
		var deferred = $q.defer();

        genericReq.request('POST', '/api/wazuh-elastic/alerts-count/', payload).then(function (data) {
			if(data.data != 0){
				deferred.resolve(true);
            }
			else
				deferred.resolve(false);
		});
		return deferred.promise;
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
            if($route.current.params._g){
                if($route.current.params._g.startsWith("h@")){
                    gParameter = sessionStorage.getItem($route.current.params._g);
                }else{
                    gParameter = $route.current.params._g;
                }
            }
            else{
                gParameter="{}";
            }
			if(gParameter != "{}" && gParameter != "()" && currentTimeFilter.time && ($scope.timeGTE != currentTimeFilter.time.from || $scope.timeLT != currentTimeFilter.time.to)){
				$scope.timeGTE = currentTimeFilter.time.from;
				$scope.timeLT = currentTimeFilter.time.to;

				//Check for present data for the selected tab
				$scope.presentData().then(function (data) {$scope.results = data;}, function(){	$scope.results = false;});
			}
		}
	});

	// Load
	$scope.presentData().then(function (data) {$scope.results = data; $scope.loading = false;}, function(){	$scope.results = false; $scope.loading = false;});
});

app.controller('overviewGeneralController', function ($scope, DataFactory, genericReq, errlog, $route) {
    $scope.load = true;
	$scope.$parent.state.setOverviewState('general');
});

app.controller('overviewFimController', function ($scope, DataFactory, genericReq, errlog, $route) {

    $scope.load = true;
	$scope.$parent.state.setOverviewState('fim');
});

app.controller('overviewPMController', function ($scope, DataFactory, genericReq, errlog, $route) {

    $scope.load = true;
    $scope.$parent.state.setOverviewState('pm');

});

app.controller('overviewOSCAPController', function ($scope, DataFactory, genericReq, errlog, $route) {

    $scope.load = false;
    $scope.$parent.state.setOverviewState('oscap');

});

app.controller('overviewAuditController', function ($scope, DataFactory, genericReq, errlog, $route) {

    $scope.load = true;
    $scope.$parent.state.setOverviewState('audit');
});

app.controller('overviewPCIController', function ($scope, $compile, DataFactory, genericReq, errlog, $route) {

    $scope.load = true;
    $scope.$parent.state.setOverviewState('pci');

	var tabs = [];
	genericReq.request('GET', '/api/wazuh-api/pci/all').then(function (data) {
		angular.forEach(data, function(value, key) {
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
