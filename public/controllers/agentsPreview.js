let app = require('ui/modules').get('app/wazuh', []);

app.controller('agentsPreviewController', function ($scope, Notifier, genericReq, apiReq, appState, Agents) {
    const notify       = new Notifier({ location: 'Agents - Preview' });
    $scope.loading     = true;
    $scope.agents      = Agents;
    $scope.status      = 'all';
    $scope.osPlatform  = 'all';
    $scope.osPlatforms = [];
    $scope.mostActiveAgent = {
        "name": "",
        "id":   ""
    };

    //Print Error
    const printError = (error) => notify.error(error.message);

    const load = () => {
        $scope.agents.nextPage('')
        .then(() => {
            // Retrieve os list
            for(let agent of $scope.agents.items){
                if('os' in agent && 'name' in agent.os){
                    let exists = $scope.osPlatforms.filter((e) => e.name === agent.os.name &&
                                                     e.platform === agent.os.platform &&
                                                     e.version === agent.os.version);
                    if(!exists.length){
                        $scope.osPlatforms.push({
                            name:     agent.os.name,
                            platform: agent.os.platform,
                            version:  agent.os.version
                        });
                    }
                }
            }
            return apiReq.request('GET', '/agents/summary', { });
        })
        .then(data => {
            if(parseInt(data.data.data['Never connected']) > 0){
                $scope.osPlatforms.push({
                    name:     'Unknown',
                    platform: 'Unknown',
                    version:  'Unknown'
                });
            }
        });


        // Get last agent !!!!!!!
        let tmpUrl  = `/api/wazuh-elastic/top/${appState.getClusterInfo().cluster}/agent.name`;
        let tmpUrl2 = `/api/wazuh-elastic/top/${appState.getClusterInfo().cluster}/agent.id`;

        genericReq.request('GET', tmpUrl)
        .then((data) => {
            if (data.data.data === '') {
                $scope.mostActiveAgent.name = $scope.cluster_info.manager;
                $scope.mostActiveAgent.id   = '000';
                return;
            }
            $scope.mostActiveAgent.name = data.data.data;
            genericReq.request('GET', tmpUrl2)
            .then((data) => {
                if (data.data.data === '' && $scope.mostActiveAgent.name !== '') {
                    $scope.mostActiveAgent.id = '000';
                } else {
                    $scope.mostActiveAgent.id = data.data.data;
                }
                $scope.loading = false;
            })
            .catch((error) => printError(error));
        })
        .catch((error) => printError(error));

        apiReq.request('GET', '/agents/summary', {})
        .then(data => {
            $scope.agentsCountActive         = data.data.data.Active;
            $scope.agentsCountDisconnected   = data.data.data.Disconnected;
            $scope.agentsCountNeverConnected = data.data.data['Never connected'];
            $scope.agentsCountTotal          = data.data.data.Total;
            $scope.agentsCoverity            = (data.data.data.Active / data.data.data.Total) * 100;
            $scope.loading                   = false;
            return apiReq.request('GET', '/agents', { sort:'-date_add', limit:1 });
        })
        .then(data => $scope.lastAgent = data.data.data.items[0])
        .catch((error) => printError(error));
    };

    //Load
    try {
        load();
    } catch (e) {
        notify.error("Unexpected exception loading controller");
    }

    //Destroy
    $scope.$on("$destroy", () => $scope.agents.reset());
});