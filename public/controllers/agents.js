import rison from 'rison-node';
// Require config
let app = require('ui/modules').get('app/wazuh', []);

app.controller('agentsController', 
function ($scope, $q, $routeParams, $route, $location, $rootScope, timefilter, Notifier, appState, genericReq, apiReq, AgentsAutoComplete) {
	const notify              = new Notifier({ location: 'Agents' });
	$rootScope.page           = 'agents';
	$scope.agentsAutoComplete = AgentsAutoComplete;

	if ($location.search().tabView){
		$scope.tabView = $location.search().tabView;
	} else {
		$scope.tabView = "panels";
		$location.search("tabView", "panels");
	}

	if ($location.search().tab){
		$scope.tab = $location.search().tab;
	} else {
		$scope.tab = "preview";
		$location.search("tab", "preview");
	}

    $scope.hideRing = (items) => {
        return $(".vis-container").length >= items;
    };

	// Object for matching nav items and Wazuh groups
	let tabFilters = {
		"overview": {
			"group": ""
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
			"group": "pci_dss"
		}
	};

    // Switch subtab
    $scope.switchSubtab = (subtab) => {
        $location.search('_a', null);
        $scope.tabView = subtab;
    };

	$scope.switchTab = (tab) => {
        // Deleing app state traces in the url
        $location.search('_a', null);
        $scope.tabView = 'panels';
	};

	// Watchers

	// We watch the resultState provided by the discover
    $rootScope.$watch('resultState', () => {
        $scope.resultState = $rootScope.resultState;
    });
	$scope.$watch('tabView', () => $location.search('tabView', $scope.tabView));
    $scope.$watch('tab', () => {
    	console.log("agents changing");
        $location.search('tab', $scope.tab);
        // Update the implicit filter
        if ($scope.tab !== 'preview') {
        	if (tabFilters[$scope.tab].group === "") $rootScope.currentImplicitFilter = "";
        	else $rootScope.currentImplicitFilter = tabFilters[$scope.tab].group;

        	$scope.loadedFilter = true;
        }
    });

	//Print Error
	const printError = (error) => notify.error(error.message);

	$scope.getAgentStatusClass = (agentStatus) => agentStatus === "Active" ? "green" : "red";

	$scope.formatAgentStatus = (agentStatus) => {
		let condition = (agentStatus !== "Active" || agentStatus === "Disconnected");
		return (condition) ? "Never connected" : agentStatus;
	};

	$scope.extensionStatus = (extension) => appState.getExtensions().extensions[extension];

	$scope.applyAgent = (agent) => {
		console.log(agent);
		$location.search('id', agent.id);
		if (agent) {
			$scope.loading = true;
			$scope.tab = 'overview';
			$location.search("tab", 'overview');

			$scope.agentInfo      = {};
			// Get Agent Info
			apiReq.request('GET', `/agents/${agent.id}`, {})
			.then((data) => {

				$scope.agentInfo = data.data.data;
				$rootScope.agent = $scope.agentInfo;
				if (typeof $scope.agentInfo.version === 'undefined') {
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

				if (typeof $scope.agentInfo.lastKeepAlive === 'undefined') {
					$scope.agentInfo.lastKeepAlive = "Unknown";
				}

				$scope._agent = data.data.data;
				$scope.search = data.data.data.name;
				$location.search('id', $scope._agent.id);

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

	// Watch for timefilter changes
	$scope.$on('$routeUpdate', () => {
		// Check if tab is empty, then reset to preview
		if (typeof $location.search().tab === 'undefined' && 
			typeof $location.search().id === 'undefined') {

			$scope.tab = "preview";
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

	$scope._fimEvent = 'all';

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
