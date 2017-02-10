import rison from 'rison-node';
var app = require('ui/modules').get('app/wazuh', []);

app.controller('overviewController', function ($scope, appState, $window, genericReq, $q, $routeParams, $route, $location) {
	
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
	
	// Check if there are any alert.
	$scope.presentData = function (group, timeAgo) {
		var deferred = $q.defer();
		genericReq.request('GET', '/api/wazuh-elastic/top/'+$scope.defaultManager+'/rule.groups/rule.groups/'+group+'/'+timeAgo)
		.then(function (data) {
			if(data.data != "")
				deferred.resolve(true);
			else
				deferred.resolve(false);
		});	
		return deferred.promise;
	};

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
	var daysAgo = 1;
	var date = new Date();
	date.setDate(date.getDate() - daysAgo);
	var timeAgo = date.getTime();
	console.log(rison.decode($route.current.params._g));
	$scope.presentData("oscap",timeAgo).then(function (data) {$scope.results = data;});
	
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