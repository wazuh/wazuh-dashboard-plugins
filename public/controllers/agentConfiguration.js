// Require config
let app = require('ui/modules').get('app/wazuh', []);

app.controller('agentConfigurationController', function($scope, $rootScope, $location, Notifier, apiReq) {
    //Initialization
    const notify   = new Notifier({ location: 'Agent - Configuration' });
    $scope.load    = true;
    $scope.isArray = angular.isArray;

    const getAgent = (newAgentId) => {
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

		return apiReq
        .request('GET', `/agents/${id}`, {});
	};

    $scope.goGroup = () => {
		$rootScope.globalAgent = $scope.agent;
		$rootScope.comeFrom    = 'agents';
		$location.search('tab', 'groups');
		$location.path('/manager');
	};

    //Load
    try {
        getAgent()
        .then(data => {
			$scope.agent = data.data.data;
            $scope.groupName = $scope.agent.group;

            return apiReq
            .request('GET', `/agents/groups/${$scope.groupName}/configuration`, {});
		})
        .then(data => {
            $scope.groupConfiguration = data.data.data.items[0];
            $scope.load = false;
        })
        .catch(error => notify.error(error.message));

    } catch (e) {
        notify.error("Unexpected exception loading controller: " + e);
    }
});
