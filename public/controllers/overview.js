import rison from 'rison-node';

let app = require('ui/modules')
.get('app/wazuh', [])
.controller('overviewController', 
function ($scope, $q, $routeParams, $route, $location, $rootScope, appState, genericReq) {

	$rootScope.page       = 'overview';
	$scope.submenuNavItem = 'general';
	$scope.extensions     = appState.getExtensions().extensions;

	if ($location.search().tabView){
		$scope.tabView = $location.search().tabView;
	} else {
		$scope.tabView = 'panels';
		$location.search('tabView', 'panels');
	}

	$scope.timeGTE = 'now-1d';
	$scope.timeLT  = 'now';

	// Object for matching nav items and Wazuh groups
	let tabGroups = {
		"general": {
			"group": "*"
		},
		"fim": {
			"group": "syscheck"
		},
		"pm": {
			"group": "rootcheck"
		},
		"oscap": {
			"group": "oscap"
		},
		"audit": {
			"group": "audit"
		},
		"pci": {
			"group": "*"
		}
	};

	$scope.hideRing = (items) => {
		return $(".vis-editor-content").length >= items;
	};

	// Switch tab
	$scope.switchTab = (tab) => {
		$scope.loading 		  = true;
		$scope.submenuNavItem = tab;
		$scope.checkAlerts()
		.then((data) => {
			$scope.results = data;
			$scope.loading = false;
		})
		.catch(() => {
			$scope.results = false;
			$scope.loading = false;
		});
	};

	// Check if there are alerts.
	$scope.checkAlerts = () => {
		let group   = tabGroups[$scope.submenuNavItem].group;
		let payload = {};
		let fields  = {
			"fields": [{
				"field": "rule.groups",
				"value": group
			}]
		};

		// No filter needed for general/pci
		if (group === '*'){
			fields = {
				"fields": []
			};
		}

		let clusterName = {
			"cluster": appState.getClusterInfo().cluster
		};

		let timeInterval = {
			"timeinterval": {
				"gte": $scope.timeGTE,
				"lt":  $scope.timeLT
			}
		};
		
		angular.extend(payload, fields, clusterName, timeInterval);

		let deferred = $q.defer();

		genericReq
			.request('POST', '/api/wazuh-elastic/alerts-count/', payload)
			.then((data) => {
				if (data.data.data !== 0){
					deferred.resolve(true);
				} else {
					deferred.resolve(false);
				}
			});

		return deferred.promise;
	};

	// Watch for timefilter changes
	$scope.$on('$routeUpdate', () => {
		if ($location.search()._g && $location.search()._g !== '()') {
			let currentTimeFilter = rison.decode($location.search()._g);
			// Check if timefilter has changed and update values
			if (currentTimeFilter.time && 
				($scope.timeGTE != currentTimeFilter.time.from || 
				$scope.timeLT != currentTimeFilter.time.to)) {

				$scope.timeGTE = currentTimeFilter.time.from;
				$scope.timeLT  = currentTimeFilter.time.to;
				$scope.checkAlerts()
				.then((data) =>	$scope.results = data)
				.catch(() => $scope.results = false);

			}
		}
	});

	// Watchers
	$scope.$watch('tabView', () => $location.search('tabView', $scope.tabView));

	// Check alerts
	$scope.checkAlerts()
	.then((data) => {
		$scope.results = data;
		$scope.loading = false;
	})
	.catch(() => {
		$scope.results = false;
		$scope.loading = false;
	});
});

app.controller('overviewGeneralController', function ($scope) {

});

app.controller('overviewFimController', function ($scope) {

});

app.controller('overviewPMController', function ($scope) {

});

app.controller('overviewOSCAPController', function ($scope) {

});

app.controller('overviewAuditController', function ($scope) {

});

app.controller('overviewPCIController', function ($scope, genericReq) {

	let tabs = [];
	
	genericReq
		.request('GET', '/api/wazuh-api/pci/all')
		.then((data) => {
			angular.forEach(data.data, (value, key) => {
				tabs.push({
					"title":   key,
					"content": value
				});
			});
		});

	$scope.tabs 		 = tabs;
	$scope.selectedIndex = 0;
});