import rison from 'rison-node';
// Require config
let app = require('ui/modules').get('app/wazuh', []);

// We are using the DataHandler template and customize its path to get information about agents
app.factory('AgentsAutoComplete', function (DataHandler) {
	let AgentsAutoComplete  = new DataHandler();
	AgentsAutoComplete.path = '/agents';
	return AgentsAutoComplete;
});

app.controller('agentsController', 
function ($scope, $q, $routeParams, $route, $location, $rootScope, Notifier, appState, genericReq, apiReq, AgentsAutoComplete) {

	const notify              = new Notifier({ location: 'Agents' });
	$rootScope.page           = 'agents';
	$scope.submenuNavItem     = 'preview';
	$scope.agentsAutoComplete = AgentsAutoComplete;

	if ($location.search().tabView){
		$scope.tabView = $location.search().tabView;
	} else {
		$scope.tabView = "panels";
		$location.search("tabView", "panels");
	}

	$scope.hideRing = (items) => $(".vis-editor-content").length >= items;

	// Object for matching nav items and Wazuh groups
	let tabGroups = {
		"overview": {
			"group": "*"
		},
		"fim": {
			"group": "syscheck"
		},
		"policy_monitoring": {
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

	$scope.switchTab = (tab) => {
		$scope.loading 		  = true;
		$scope.submenuNavItem = tab;
		$scope.checkAlerts($scope._agent.id)
		.then((data) => {
			$scope.results = data;
			$scope.loading = false;
		})
		.catch(() => {
			$scope.results = false;
			$scope.loading = false;
		});
	};

	//Print Error
	const printError = (error) => notify.error(error.message);

	// Check if there are any alert.
	$scope.checkAlerts = (agent_id) => {
		let group   = tabGroups[$scope.submenuNavItem].group;
		let payload = {};
		let fields = {
			"fields": [{
				"field": "rule.groups",
				"value": group
			}, {
				"field": "agent.id",
				"value": agent_id
			}]
		};

		// No filter needed for general/pci
		if (group === '*'){
			fields = {
				"fields": [{
					"field": "agent.id",
					"value": agent_id
				}]
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
		genericReq.request('POST', '/api/wazuh-elastic/alerts-count/', payload)
		.then((data) => {
			if (data.data.data !== 0){
				deferred.resolve(true);
			} else {
				deferred.resolve(false);
			}
		});

		return deferred.promise;
	};

	$scope.getAgentStatusClass = (agentStatus) => agentStatus === "Active" ? "green" : "red";

	$scope.formatAgentStatus = (agentStatus) => {
		let condition = (agentStatus !== "Active" || agentStatus === "Disconnected");
		return (condition) ? "Never connected" : agentStatus;
	};

	$scope.extensionStatus = (extension) => appState.getExtensions().extensions[extension];

	$scope.applyAgent = (agent) => {
		if (agent) {
			$scope.loading        = true;
			$scope.submenuNavItem = 'overview';
			$scope.agentInfo      = {};
			// Get Agent Info
			apiReq.request('GET', `/agents/${agent.id}`, {})
			.then((data) => {
				$scope.agentInfo = data.data.data;
				$rootScope.agent = $scope.agentInfo;
				if (typeof $scope.agentInfo.version === 'undefined'){
					$scope.agentInfo.version = "Unknown";
				}
				if (typeof $scope.agentInfo.os === 'undefined') {
					$scope.agentOs = "Unknown";
				} else {
					if (typeof $scope.agentInfo.os.name !== 'undefined') {
						$scope.agentOs = `${$scope.agentInfo.os.name} ${$scope.agentInfo.os.version}`;
					} else {
						if (typeof $scope.agentInfo.os.uname !== 'undefined') {
							$scope.agentOs = $scope.agentInfo.os.uname;
						} else {
							$scope.agentOs = "Unknown";
						}
					}
				}

				if (typeof $scope.agentInfo.lastKeepAlive === 'undefined'){
					$scope.agentInfo.lastKeepAlive = "Unknown";
				}

				$scope._agent = data.data.data;
				$scope.search = data.data.data.name;
				$location.search('id', $scope._agent.id);

				$scope.checkAlerts($scope._agent.id)
				.then((data) => {
					$scope.results = data;
					$scope.loading = false;
				});

				apiReq.request('GET', `/syscheck/${agent.id}/last_scan`, {})
				.then((data) => {
					$scope.agentInfo.syscheck          = data.data.data;
					$scope.agentInfo.syscheck.duration = "Unknown";
					if (!$scope.agentInfo.syscheck.end && !$scope.agentInfo.syscheck.start) {
						let syscheckTime    = new Date($scope.agentInfo.syscheck.start);
						let syscheckEndTime = new Date($scope.agentInfo.syscheck.end);
						let minutes         = ((syscheckEndTime - syscheckTime) / 1000) / 60;
						$scope.agentInfo.syscheck.duration = window.Math.round(minutes);
					} else if (!$scope.agentInfo.syscheck.end) {
						$scope.agentInfo.syscheck.end = "Unknown";
					} else {
						$scope.agentInfo.syscheck.start = "Unknown";
					}
				})
				.catch((err) => printError(err));

				// Get rootcheck info
				apiReq.request('GET', `/rootcheck/${agent.id}/last_scan`, {})
				.then((data) => {
					$scope.agentInfo.rootcheck          = data.data.data;
					$scope.agentInfo.rootcheck.duration = "Unknown";
					if ($scope.agentInfo.rootcheck.end && $scope.agentInfo.rootcheck.start) {
						let rootcheckTime    = new Date($scope.agentInfo.rootcheck.start);
						let rootcheckEndTime = new Date($scope.agentInfo.rootcheck.end);
						let minutes          = ((rootcheckEndTime - rootcheckTime) / 1000) / 60;
						$scope.agentInfo.rootcheck.duration = window.Math.round(minutes);
					} else if ($scope.agentInfo.rootcheck.end) {
						$scope.agentInfo.rootcheck.end = "Unknown";
					} else {
						$scope.agentInfo.rootcheck.start = "Unknown";
					}
				})
				.catch((err) => printError(err));
			})
			.catch((err) => printError(err));
		}
	};

	// Copy agent from groups tab
	if($rootScope.comeFromGroups){
		let tmpAgent = Object.assign($rootScope.comeFromGroups);
		delete $rootScope.comeFromGroups;
		$scope.applyAgent(tmpAgent);
	}


	// Watchers
	$scope.$watch('tabView', () => $location.search('tabView', $scope.tabView));

	// Watch for timefilter changes
	$scope.$on('$routeUpdate', () => {
		if ($location.search()._g && $location.search()._g !== '()') {
			let currentTimeFilter = rison.decode($location.search()._g);
			// Check if timefilter has changed and update values
			let gParameter;

			if ($route.current.params._g.startsWith("h@")) {
				gParameter = sessionStorage.getItem($route.current.params._g);
			} else {
				gParameter = $route.current.params._g;
			}

			if (gParameter != "()" && (
				$scope.timeGTE != currentTimeFilter.time.from || 
				$scope.timeLT != currentTimeFilter.time.to)
			) {
				$scope.timeGTE = currentTimeFilter.time.from;
				$scope.timeLT  = currentTimeFilter.time.to;

				//Check for present data for the selected tab
				if ($scope.submenuNavItem !== "preview") {
					if(!('_agent' in $scope)){
						console.log('Waiting for an agent...');
					} else {
						$scope.checkAlerts($scope._agent.id)
						.then((data) => $scope.results = data)
						.catch(() => $scope.results = false);
					}
				}
			}
		}
		// Check if tab is empty, then reset to preview
		if (typeof $location.search().tab === 'undefined' && 
			typeof $location.search().id === 'undefined') {

			$scope.submenuNavItem = "preview";
			delete $scope._agent;
			$scope.search = "";
		}
	});

	//Load
	try {
		$scope.agentsAutoComplete.nextPage('')
		.then(() => $scope.loading = false);
	} catch (e) {
		notify.error('Unexpected exception loading controller');
	}

	//Destroy
	$scope.$on("$destroy", () => $scope.agentsAutoComplete.reset());


});

app.controller('agentsOverviewController', function ($scope) {});

app.controller('fimController', ($scope) =>	$scope._fimEvent = 'all');

app.controller('pmController', function ($scope) {});

app.controller('auditController', function ($scope) {});

app.controller('oscapController', function ($scope) {});

app.controller('PCIController', function ($scope, genericReq) {
	let tabs = [];
	genericReq.request('GET', '/api/wazuh-api/pci/all')
		.then((data) => {
			angular.forEach(data.data, (value, key) => {
				tabs.push({
					"title": key,
					"content": value
				});
			});
		});

	$scope.tabs 		 = tabs;
	$scope.selectedIndex = 0;

	$scope.addTab = (title, view) => {
		view = view || title + " Content View";
		tabs.push({
			title:    title,
			content:  view,
			disabled: false
		});
	};

	$scope.removeTab = (tab) => {
		let index = tabs.indexOf(tab);
		tabs.splice(index, 1);
	};
});