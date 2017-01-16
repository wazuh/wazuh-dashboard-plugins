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

app.controller('generalController', function ($scope, appState, $window) {
    $scope.state = appState;

    $scope.openDashboard = function (dashboard, filter) {
        $scope.state.setDashboardsState(dashboard, filter);
		$window.location.href = '#/dashboards/';

    }
	$scope.openDiscover = function (template, filter) {
        $scope.state.setDiscoverState(template, filter);
		$window.location.href = '#/discover/';
    }

	$scope.changeTabView = function (view) {
        $scope.tabView = view;
    }

});
