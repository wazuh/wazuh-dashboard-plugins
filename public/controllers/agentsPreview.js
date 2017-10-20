var app = require('ui/modules').get('app/wazuh', []);

// We are using the DataHandler template and customize its path to get information about agents
app.factory('Agents', function(DataHandler) {
	var Agents = new DataHandler();
	Agents.path = '/agents';
	return Agents;
});

app.controller('agentsPreviewController', function ($scope, Notifier, genericReq, apiReq, appState, Agents) {
	const notify = new Notifier({location: 'Agents - Preview'});
	$scope.loading = true;
	$scope.agents = Agents;
	$scope.status = 'all';
	$scope.osPlatform = 'all';
	$scope.osPlatforms = []
	$scope.mostActiveAgent = {"name" : "", "id" : ""};

    //Print Error
    var printError = function (error) {
        notify.error(error.message);
    };

    var load = function () {
		$scope.agents.nextPage('').then(function (data) {
			// Retrieve os list
			angular.forEach($scope.agents.items, function(agent) {
				$scope.osPlatforms.push(agent.os.name);
			});
			$scope.osPlatforms = new Set($scope.osPlatforms);
			$scope.osPlatforms = Array.from($scope.osPlatforms); // Angularjs doesn't support ES6 objects
		});

		// Get last agent !!!!!!!

        genericReq.request('GET', '/api/wazuh-elastic/top/' + appState.getClusterInfo().cluster + '/agent.name').then(function (data) {
			if(data.data.data == "") {
				$scope.mostActiveAgent.name = $scope.cluster_info.manager;
				$scope.mostActiveAgent.id = "000";
				return;
			}
			$scope.mostActiveAgent.name = data.data.data;
			genericReq.request('GET', '/api/wazuh-elastic/top/' + appState.getClusterInfo().cluster + '/agent.id').then(function (data) {
				if(data.data.data == "" && $scope.mostActiveAgent.name != "") {
					$scope.mostActiveAgent.id = "000";
				}else{
					$scope.mostActiveAgent.id = data.data.data;
				}
				$scope.loading = false;
			}, printError);
		}, printError);

        apiReq.request('GET', '/agents/summary', {}).then(function (data) {
			$scope.agentsCountActive = data.data.data.Active;
			$scope.agentsCountDisconnected = data.data.data.Disconnected;
			$scope.agentsCountNeverConnected = data.data.data['Never connected'];
			$scope.agentsCountTotal = data.data.data.Total;
			$scope.agentsCoverity = (data.data.data.Active / data.data.data.Total) * 100;
			$scope.loading = false;
		}, printError);
    };

    //Load
    try {
        load();
    } catch (e) {
		notify.error("Unexpected exception loading controller");
    }

    //Destroy
    $scope.$on("$destroy", function () {
    	$scope.agents.reset();
    });
});
