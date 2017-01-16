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

app.controller('generalController', function ($scope, appState, $window, genericReq, $q) {
    $scope.state = appState;
	$scope.defaultManager = $scope.state.getDefaultManager().name;
	$scope.dynamicTab_fields = {};
	
	
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
	
	var daysAgo = 7;
	var date = new Date();
	date.setDate(date.getDate() - daysAgo);
	var timeAgo = date.getTime();
	
	// Function: Check if rule group exists on Elastic cluster latest alerts.
	$scope.dynamicTab_exists = function (group) {
		genericReq.request('GET', '/api/wazuh-elastic/top/'+$scope.defaultManager+'/rule.groups/rule.groups/'+group)
			.then(function (data) {
				console.log(data);
				if(data.data != ""){
					$scope.dynamicTab_fields[group] = true;
				}else{
					$scope.dynamicTab_fields[group] = false
				}
        });	
    };
	// Checking dynamic panels
	$scope.dynamicTab_exists("oscap");

});
