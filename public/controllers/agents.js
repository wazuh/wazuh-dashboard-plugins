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
        $location.search('tab', $scope.tab);
        // Update the implicit filter
        if ($scope.tab !== 'preview') {
        	if (tabFilters[$scope.tab].group === "") $rootScope.currentImplicitFilter = "";
        	else $rootScope.currentImplicitFilter = tabFilters[$scope.tab].group;
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

	const calculateMinutes = (start,end) => {
		let time    = new Date(start);
		let endTime = new Date(end);
		let minutes         = ((endTime - time) / 1000) / 60;
		return minutes;
	}

	const validateRootCheck = () => {
		$scope.agentInfo.rootcheck.duration = 'Unknown';
		if ($scope.agentInfo.rootcheck.end && $scope.agentInfo.rootcheck.start) {
			let minutes = calculateMinutes($scope.agentInfo.rootcheck.start, $scope.agentInfo.rootcheck.end);
			$scope.agentInfo.rootcheck.duration = window.Math.round(minutes);
		} else {
			if (!$scope.agentInfo.rootcheck.end) {
				$scope.agentInfo.rootcheck.end = 'Unknown';
			} 
			if (!$scope.agentInfo.rootcheck.start){
				$scope.agentInfo.rootcheck.start = 'Unknown';
			}
		}	
	}

	const validateSysCheck = () => {
		$scope.agentInfo.syscheck.duration = 'Unknown';
		if ($scope.agentInfo.syscheck.end && $scope.agentInfo.syscheck.start) {
			let minutes  = calculateMinutes($scope.agentInfo.syscheck.start, $scope.agentInfo.syscheck.end);
			$scope.agentInfo.syscheck.duration = window.Math.round(minutes);
		} else {
			if (!$scope.agentInfo.syscheck.end) {
				$scope.agentInfo.syscheck.end = 'Unknown';
			} 
			if (!$scope.agentInfo.syscheck.start){
				$scope.agentInfo.syscheck.start = 'Unknown';
			}
		}
	}

	$scope.applyAgent = agent => {
		if (agent) {
			$scope.loading = true;
			$scope.tab = 'overview';
			$location.search('tab', 'overview');

			$scope.agentInfo = agent;
			$rootScope.agent = $scope.agentInfo;

			if (typeof $scope.agentInfo.version === 'undefined') {
				$scope.agentInfo.version = 'Unknown';
			}

			$scope.agentOs = 'Unknown';
			if (typeof $scope.agentInfo.os !== 'undefined' && typeof $scope.agentInfo.os.name !== 'undefined') {
				$scope.agentOs = `${$scope.agentInfo.os.name} ${$scope.agentInfo.os.version}`;
			} else if (typeof $scope.agentInfo.os !== 'undefined' && typeof $scope.agentInfo.os.uname !== 'undefined') {
				$scope.agentOs = $scope.agentInfo.os.uname;
			}

			if (typeof $scope.agentInfo.lastKeepAlive === 'undefined') {
				$scope.agentInfo.lastKeepAlive = 'Unknown';
			}

			$scope._agent = agent;
			$scope.search = agent.name;
			$location.search('id', $scope._agent.id);

			// Update the implicit filter
			if ($scope.tab !== 'preview') {
				if (!tabFilters[$scope.tab].group) {
					$rootScope.currentImplicitFilter = `agent.id : "${$scope._agent.id}"`;
				} else {
					$rootScope.currentImplicitFilter = `agent.id : "${$scope._agent.id}" rule.groups : "${tabFilters[$scope.tab].group}"`;
				}
			}
			
			Promise.all([
				$scope.checkAlerts($scope._agent.id),
				apiReq.request('GET', `/syscheck/${agent.id}/last_scan`, {}),
				apiReq.request('GET', `/rootcheck/${agent.id}/last_scan`, {})
			])
			.then(data => {
				// Checkalerts
				$scope.results = data[0];

				// Syscheck
				$scope.agentInfo.syscheck = data[1].data.data;
				validateSysCheck();		

				// Rootcheck
				$scope.agentInfo.rootcheck = data[2].data.data;
				validateRootCheck();	

				$scope.loading = false;
			})
			.catch(error => notify.error(error.message));
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
			for(let key in data.data){
				tabs.push({
					"title": key,
					"content": data.data[key]
				});
			}
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
