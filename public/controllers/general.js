// Require config
var app = require('ui/modules').get('app/wazuh', []);

app.controller('stateController', function ($scope, appState, $route) {
    $scope.state = appState;
    $scope.select = $route.current.params.select;
	$scope.submenuNavItem2 = "rules";

	$scope.setRulesTab = function(tab) {
		$scope.submenuNavItem2 = tab;
	};

});

app.controller('generalController', function ($scope, appState, $window, genericReq, $q, $routeParams, $route, $location) {
	
    $scope.state = appState;
	$scope.defaultManager = $scope.state.getDefaultManager().name;
	$scope.extensions = $scope.state.getExtensions().extensions;
	$scope.submenuNavItem = "general";
	$scope.tabView = "panels";
	
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
	
	$scope.$watch('submenuNavItem', function() {
		$location.search('tab', $scope.submenuNavItem);
	});	

});
