let app = require('ui/modules').get('app/wazuh', []);

app.controller('agentsPreviewController', function ($scope,$rootScope, Notifier, genericReq, apiReq, appState, Agents, $location) {
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

    let tmpUrl  = `/api/wazuh-elastic/top/${appState.getClusterInfo().cluster}/agent.name`;
    let tmpUrl2 = `/api/wazuh-elastic/top/${appState.getClusterInfo().cluster}/agent.id`;

    // Retrieve os list
    const retrieveList = () => {
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
    }

    const load = () => {
        Promise.all([
            $scope.agents.nextPage(''),
            apiReq.request('GET', '/agents/summary', { }),
            genericReq.request('GET', tmpUrl),
            apiReq.request('GET', '/agents', { sort:'-date_add', limit:1 })
        ])
        .then(data => {

            // Next page
            retrieveList();

            // Agents summary
            if(parseInt(data[1].data.data['Never connected']) > 0){
                $scope.osPlatforms.push({
                    name:     'Unknown',
                    platform: 'Unknown',
                    version:  'Unknown'
                });
            }
            $scope.agentsCountActive         = data[1].data.data.Active;
            $scope.agentsCountDisconnected   = data[1].data.data.Disconnected;
            $scope.agentsCountNeverConnected = data[1].data.data['Never connected'];
            $scope.agentsCountTotal          = data[1].data.data.Total;
            $scope.agentsCoverity            = (data[1].data.data.Active / data[1].data.data.Total) * 100;

            // tmpUrl y tmpUrl2
            if (data[2].data.data === '') {
                $scope.mostActiveAgent.name = $scope.cluster_info.manager;
                $scope.mostActiveAgent.id   = '000';
            } else {
                $scope.mostActiveAgent.name = data[2].data.data;
                genericReq.request('GET', tmpUrl2)
                .then(info => {
                    if (info.data.data === '' && $scope.mostActiveAgent.name !== '') {
                        $scope.mostActiveAgent.id = '000';
                    } else {
                        $scope.mostActiveAgent.id = info.data.data;
                    }
                    $scope.loading = false;
                })
                .catch(error => notify.error(error.message));
            }

            // Last agent
            $scope.lastAgent = data[3].data.data.items[0]

            $scope.loading = false;
            $scope.$digest();
        })
        .catch(error => notify.error(error.message));
    };

    $scope.showAgent = agent => {
        $rootScope.globalAgent = agent.id;
        $rootScope.comeFrom    = 'agentsPreview';
        $location.path('/agents');        
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
