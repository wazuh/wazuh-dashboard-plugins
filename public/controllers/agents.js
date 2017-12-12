let app = require('ui/modules').get('app/wazuh', []);

app.controller('agentsController', 
function ($scope, $location, $q, $rootScope, Notifier, appState, genericReq, apiReq, AgentsAutoComplete) {
	$rootScope.page = 'agents';
    $scope.extensions = appState.getExtensions().extensions;
	$scope.agentsAutoComplete = AgentsAutoComplete;
	const notify = new Notifier({ location: 'Agents' });

    // Check the url hash and retriew the tabView information 
	if ($location.search().tabView){
		$scope.tabView = $location.search().tabView;
	} else { // If tabView doesn't exist, default it to 'panels' view
		$scope.tabView = "panels";
		$location.search("tabView", "panels");
	}

    // Check the url hash and retrivew the tab information 
	if ($location.search().tab){
		$scope.tab = $location.search().tab;
	} else { // If tab doesn't exist, default it to 'general' view
		$scope.tab = "general";
		$location.search("tab", "general");

        // Now we initialize the implicitFilter
        $rootScope.currentImplicitFilter = "";
	}

	// Object for matching nav items and Wazuh groups
	let tabFilters = {
		"general": {
			"group": ""
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
			"group": "pci_dss"
		}
	};

    // Switch subtab
    $scope.switchSubtab = (subtab) => {
        $scope.tabView = subtab;
    };

	$scope.switchTab = (tab) => {
        // Deleting app state traces in the url
        $location.search('_a', null);
        $scope.tabView = 'panels';
	};

	// Watchers

	// We watch the resultState provided by the discover
	$scope.$watch('tabView', () => $location.search('tabView', $scope.tabView));
    $scope.$watch('tab', () => {
        $location.search('tab', $scope.tab);
        // Update the implicit filter
        if (tabFilters[$scope.tab].group === "") $rootScope.currentImplicitFilter = "";
        else $rootScope.currentImplicitFilter = tabFilters[$scope.tab].group;
    });

    // Agent data
	$scope.getAgentStatusClass = (agentStatus) => agentStatus === "Active" ? "green" : "red";

	$scope.formatAgentStatus = (agentStatus) => {
		let condition = (agentStatus !== "Active" || agentStatus === "Disconnected");
		return (condition) ? "Never connected" : agentStatus;
	};

	const calculateMinutes = (start,end) => {
		let time    = new Date(start);
		let endTime = new Date(end);
		let minutes = ((endTime - time) / 1000) / 60;
		return minutes;
	}

	const validateRootCheck = () => {
		$scope.agent.rootcheck.duration = 'Unknown';
		if ($scope.agent.rootcheck.end && $scope.agent.rootcheck.start) {
			let minutes = calculateMinutes($scope.agent.rootcheck.start, $scope.agent.rootcheck.end);
			$scope.agent.rootcheck.duration = window.Math.round(minutes);
		} else {
			if (!$scope.agent.rootcheck.end) {
				$scope.agent.rootcheck.end = 'Unknown';
			} 
			if (!$scope.agent.rootcheck.start){
				$scope.agent.rootcheck.start = 'Unknown';
			}
		}	
	}

	const validateSysCheck = () => {
		$scope.agent.syscheck.duration = 'Unknown';
		if ($scope.agent.syscheck.end && $scope.agent.syscheck.start) {
			let minutes  = calculateMinutes($scope.agent.syscheck.start, $scope.agent.syscheck.end);
			$scope.agent.syscheck.duration = window.Math.round(minutes);
		} else {
			if (!$scope.agent.syscheck.end) {
				$scope.agent.syscheck.end = 'Unknown';
			} 
			if (!$scope.agent.syscheck.start){
				$scope.agent.syscheck.start = 'Unknown';
			}
		}
	}

	$scope.getAgent = newAgentId => {
		let id = null;

		// They passed an id
		if (newAgentId) {
			id = newAgentId;
			$location.search('agent', id);
		} else {
			if ($location.search().agent) { // There's one in the url
				id = $location.search().agent;
			} else { // We pick the one in the rootScope
				id = $rootScope.globalAgent;
				$location.search('agent', id);
				delete $rootScope.globalAgent;
			}
		}

		Promise.all([
			apiReq.request('GET', `/agents/${id}`, {}),
			apiReq.request('GET', `/syscheck/${id}/last_scan`, {}),
			apiReq.request('GET', `/rootcheck/${id}/last_scan`, {})
		])
		.then(data => {
			// Agent
			$scope.agent = data[0].data.data;

			if ($scope.agent.os) {
				$scope.agentOS = $scope.agent.os.name + ' ' + $scope.agent.os.version;
			}
			else { $scope.agentOS = "Unkwnown" };

			// Syscheck
			$scope.agent.syscheck = data[1].data.data;
			validateSysCheck();		
			// Rootcheck
			$scope.agent.rootcheck = data[2].data.data;
			validateRootCheck();	

			$scope.$digest();
		})
		.catch(error => notify.error(error.message));
	};

	$scope.goGroups = agent => {
		$rootScope.globalAgent = agent;
		$rootScope.comeFrom    = 'agents';
		$location.search('tab', 'groups');
		$location.path('/manager');        
	};


    $scope.analizeAgents = search => {
        let deferred = $q.defer();
        
        let promise;
        $scope.agentsAutoComplete.filters = [];

        promise = $scope.agentsAutoComplete.addFilter('search',search);
       
        promise
        .then(() => deferred.resolve($scope.agentsAutoComplete.items))
        .catch(error => notify.error(error));

        return deferred.promise;
    }

	//Load
	try {
		$scope.getAgent();
		$scope.agentsAutoComplete.nextPage('');
	} catch (e) {
		notify.error('Unexpected exception loading controller');
	}

	//Destroy
	$scope.$on("$destroy", () => $scope.agentsAutoComplete.reset());

	//PCI tab
	let tabs = [];
	genericReq.request('GET', '/api/wazuh-api/pci/all')
		.then((data) => {
			for(let key in data.data){
				tabs.push({
					"title": key,
					"content": data.data[key]
				});
			}
		})
		.catch(error => notify.error(error.message));

	$scope.tabs 		 = tabs;
	$scope.selectedIndex = 0;
});
