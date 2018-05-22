import FilterHandler from './filter-handler'

const app = require('ui/modules').get('app/wazuh', []);

// Logs controller
app.controller('clusterController', function ($scope, $rootScope, errorHandler, apiReq, ClusterNodes, $window, $location, discoverPendingUpdates, rawVisualizations, loadedVisualizations, visHandlers, tabVisualizations, appState, genericReq) {
    const clusterEnabled = appState.getClusterInfo() && appState.getClusterInfo().status === 'enabled';
    $scope.isClusterEnabled = clusterEnabled;
    $location.search('tabView','cluster-monitoring');
    $location.search('_a',null)
    const filterHandler = new FilterHandler(appState.getCurrentPattern());
    discoverPendingUpdates.removeAll();
    tabVisualizations.removeAll();
    rawVisualizations.removeAll();
    loadedVisualizations.removeAll();
    tabVisualizations.setTab('monitoring');
    tabVisualizations.assign({
        monitoring: 2
    });

    $scope.loading    = true;
    $scope.showConfig = false;
    $scope.showNodes  = false;
    $scope.nodeSearchTerm = '';
    $location.search('tab','general')
    
    $scope.nodes = ClusterNodes;

    const setBooleans = component => {
        $scope.showConfig = component === 'showConfig';
        $scope.showNodes  = component === 'showNodes';
    }

    $scope.goAgents = () => {
        $window.location.href = '#/agents-preview';
    }

    $scope.goConfiguration = () => {
        setBooleans('showConfig');
    }

    $scope.goNodes = () => {
        setBooleans('showNodes');
    }

    $scope.goBack = () => {
        setBooleans(null);
    }


    let filters = [];
    const assignFilters = () => {
        try{

            filters = [];
            filters.push(filterHandler.managerQuery(
                appState.getClusterInfo().cluster, 
                true
            ))

            $rootScope.$emit('wzEventFilters',{ filters, localChange: false });
            if(!$rootScope.$$listenerCount['wzEventFilters']){
                $timeout(100)
                .then(() => assignFilters())
            }
        } catch(error) {
            console.log(error.message || error)
            errorHandler.handle('An error occurred while creating custom filters for visualizations','Cluster',true);
        }
    }

    const load = async () => {
        try {

            // Start timelions
            visHandlers.removeAll();
            discoverPendingUpdates.removeAll();
            rawVisualizations.removeAll();
            loadedVisualizations.removeAll();

            const visData = await genericReq.request('GET',`/api/wazuh-elastic/create-vis/cluster-monitoring/${appState.getCurrentPattern()}`)
    
            rawVisualizations.assignItems(visData.data.raw);
            assignFilters();
            $rootScope.$broadcast('updateVis');
            // End timelions

            await $scope.nodes.nextPage();

            const data = await Promise.all([
                apiReq.request('GET','/cluster/status',{}),
                apiReq.request('GET','/cluster/nodes',{}),
                apiReq.request('GET','/cluster/config',{}),
                apiReq.request('GET','/version',{}),
                apiReq.request('GET','/agents',{limit:1}),
                apiReq.request('GET','/cluster/healthcheck',{})
            ]);

            const status = data[0]
            $scope.status = status.data.data.running;
            
            const nodesCount = data[1].data.data.totalItems
            $scope.nodesCount = nodesCount;

            const configuration = data[2]
            $scope.configuration = configuration.data.data;
            
            const version = data[3]
            $scope.version = version.data.data;

            const agents = data[4]
            $scope.agentsCount = agents.data.data.totalItems;

            const health = data[5];
            $scope.healthCheck = health.data.data;

            $scope.loading = false;
            if(!$scope.$$phase) $scope.$digest();
            return;
        } catch(error) {
            errorHandler.handle(error,'Cluster')
        }
    }

    console.log('DEBUG 2')
    if(clusterEnabled) load();

    $scope.$on('destroy',() => {
        $location.search('tabView',null);
        discoverPendingUpdates.removeAll();
        tabVisualizations.removeAll();
        rawVisualizations.removeAll();
        loadedVisualizations.removeAll();
        visHandlers.removeAll();
    })

});
