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

    let tmpUrl, tmpUrl2;
    if (appState.getClusterInfo().status === 'enabled') {
        tmpUrl  = `/api/wazuh-elastic/top/cluster/${appState.getClusterInfo().cluster}/agent.name`;
        tmpUrl2 = `/api/wazuh-elastic/top/cluster/${appState.getClusterInfo().cluster}/agent.id`;
    } else {
        tmpUrl  = `/api/wazuh-elastic/top/manager/${appState.getClusterInfo().manager}/agent.name`;
        tmpUrl2 = `/api/wazuh-elastic/top/manager/${appState.getClusterInfo().manager}/agent.id`;
    }

    $scope.applyFilters = filter => {
        const platform = filter.split(' - ')[0];
        const version  = filter.split(' - ')[1];
        $scope.agents.addFilter('os.platform', platform);
        $scope.agents.addFilter('os.version', version);
    }

    // Retrieve os list
    const retrieveList = agents => {
        for(let agent of agents){

            if('os' in agent && 'name' in agent.os){
                let exists = $scope.osPlatforms.filter((e) => e.name === agent.os.name && e.platform === agent.os.platform && e.version === agent.os.version);
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
            apiReq.request('GET', '/agents', { sort:'-date_add', limit:9999999 })
        ])
        .then(data => {



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
                $scope.mostActiveAgent.name = appState.getClusterInfo().manager;
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
            $scope.lastAgent = data[3].data.data.items[0];

            retrieveList(data[3].data.data.items);

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
