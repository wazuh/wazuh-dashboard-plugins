import rison from 'rison-node';
var app = require('ui/modules').get('app/wazuh', []);

app.controller('overviewController', function ($scope, appState, $window, genericReq, $q, $routeParams, $route, $location, $http) {
	
    $scope.state = appState;
	$scope.defaultManager = $scope.state.getDefaultManager().name;
	$scope.extensions = $scope.state.getExtensions().extensions;
	$scope.submenuNavItem = "general";
	$scope.tabView = "panels";
	
	// Object for matching nav items and Wazuh groups
	var tabGroups = {
		"general": {"group": "*"},
		"fim": {"group": "syscheck"},
		"pm": {"group": "rootcheck"},
		"oscap": {"group": "oscap"},
		"audit": {"group": "audit"},
		"pci": {"group": "*"}
	};

	var tab = "";
	var view = "";
    if($routeParams.tab)
		$scope.submenuNavItem  = $routeParams.tab;
	
	if($routeParams.view)
		$scope.tabView  = $routeParams.view;
	
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
	
	$scope.$watch('tabView', function() {
		$location.search('view', $scope.tabView);		
	});
	
	$scope.results = false;
	$scope.$watch('submenuNavItem', function() {
		$location.search('tab', $scope.submenuNavItem);
		$scope.presentData().then(function (data) {$scope.results = data;});
	});	
	
	// Get current time filter or default
	$scope.timeGTE = ($route.current.params._g != "()") ? rison.decode($route.current.params._g).time.from : "now-1d";
	$scope.timeLT = ($route.current.params._g != "()") ? rison.decode($route.current.params._g).time.to : "now";

	// Check if there are any alert. 
	$scope.presentData = function () {
		var group = tabGroups[$scope.submenuNavItem].group;
		var payload = {};
		var fields = {"fields" : [{"field": "rule.groups", "value": group}]};
		// No filter needed for general/pci
		if(group == "*")
			fields = {"fields" : []};
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
	
	// Watch for timefilter changes
	$scope.$on('$routeUpdate', function(){
		var currentTimeFilter = rison.decode($location.search()._g);
		// Check if timefilter has changed and update values
		if($route.current.params._g != "()" && ($scope.timeGTE != currentTimeFilter.time.from || $scope.timeLT != currentTimeFilter.time.to)){
			$scope.timeGTE = currentTimeFilter.time.from;
			$scope.timeLT = currentTimeFilter.time.to;
			
			//Check for present data for the selected tab
			$scope.presentData().then(function (data) {$scope.results = data;});
		}
	});

});

app.controller('overviewGeneralController', function ($scope, DataFactory, genericReq, $mdToast, errlog, $route) {
	
    $scope.load = true;
	$scope.$parent.state.setOverviewState('general');
	$scope.defaultManager = $scope.$parent.state.getDefaultManager().name;
	
});

app.controller('overviewFimController', function ($scope, DataFactory, genericReq, $mdToast, errlog, $route) {

    $scope.load = true;
	$scope.$parent.state.setOverviewState('fim');
	$scope.defaultManager = $scope.$parent.state.getDefaultManager().name;

});

app.controller('overviewPMController', function ($scope, DataFactory, genericReq, $mdToast, errlog, $route) {

    $scope.load = true;
    $scope.$parent.state.setOverviewState('pm');
	$scope.defaultManager = $scope.$parent.state.getDefaultManager().name;

});

app.controller('overviewOSCAPController', function ($scope, DataFactory, genericReq, $mdToast, errlog, $route) {

    $scope.load = false;
    $scope.$parent.state.setOverviewState('oscap');
	$scope.defaultManager = $scope.$parent.state.getDefaultManager().name;
	
});

app.controller('overviewAuditController', function ($scope, DataFactory, genericReq, $mdToast, errlog, $route) {

    $scope.load = true;
    $scope.$parent.state.setOverviewState('audit');
	$scope.defaultManager = $scope.$parent.state.getDefaultManager().name;
});

app.controller('overviewPCIController', function ($scope, $compile, DataFactory, genericReq, $mdToast, errlog, $route) {

    $scope.load = true;
    $scope.$parent.state.setOverviewState('pci');
	$scope.defaultManager = $scope.$parent.state.getDefaultManager().name;
	
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