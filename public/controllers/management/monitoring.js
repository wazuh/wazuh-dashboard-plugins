/*
 * Wazuh app - Cluster monitoring controller
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { FilterHandler } from '../../utils/filter-handler'
import { uiModules }     from 'ui/modules'

const app = uiModules.get('app/wazuh', []);

// Logs controller
app.controller('clusterController', function ($scope, $rootScope, $timeout, errorHandler, apiReq, $window, $location, discoverPendingUpdates, rawVisualizations, loadedVisualizations, visHandlers, tabVisualizations, appState, genericReq) {
    $scope.search = term => {
        $scope.$broadcast('wazuhSearch',{term})
    }

    const clusterEnabled = appState.getClusterInfo() && appState.getClusterInfo().status  === 'enabled';
    $scope.isClusterEnabled = clusterEnabled;
    $scope.isClusterRunning = true;
    $location.search('tabView','cluster-monitoring');
    $location.search('tab','monitoring')
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

    $scope.loading     = true;
    $scope.showConfig  = false;
    $scope.showNodes   = false;
    $scope.currentNode = null;
    $scope.nodeSearchTerm = '';
    
    const setBooleans = component => {
        $scope.showConfig = component === 'showConfig';
        $scope.showNodes  = component === 'showNodes';
        $scope.currentNode = null;
    }

    $scope.goAgents = () => {
        $window.location.href = '#/agents-preview';
    }

    $scope.goConfiguration = () => {
        setBooleans('showConfig');
        tabVisualizations.assign({
            monitoring: 1
        });
        assignFilters();
        $rootScope.$broadcast('updateVis');
    }

    $scope.goNodes = () => {
        setBooleans('showNodes');
        tabVisualizations.assign({
            monitoring: 1
        });
        assignFilters();
        $rootScope.$broadcast('updateVis');
    }

    $scope.goBack = () => {
        setBooleans(null);
        tabVisualizations.assign({
            monitoring: 2
        });
        assignFilters();
        $rootScope.$broadcast('updateVis');
    }

    $scope.$on('wazuhShowClusterNode',async (event,parameters) => {
        try {
            tabVisualizations.assign({
                monitoring: 1
            });
            $scope.currentNode = parameters.node;
            const data = await apiReq.request('GET','/cluster/healthcheck',{ node: $scope.currentNode.name });

            $scope.currentNode.healthCheck = data.data.data.nodes[$scope.currentNode.name];

            if($scope.currentNode.healthCheck && $scope.currentNode.healthCheck.status) {

                $scope.currentNode.healthCheck.status.last_sync_integrity.duration   = 'n/a';
                $scope.currentNode.healthCheck.status.last_sync_agentinfo.duration   = 'n/a';
                $scope.currentNode.healthCheck.status.last_sync_agentgroups.duration = 'n/a';

                if($scope.currentNode.healthCheck.status.last_sync_integrity.date_start_master !== 'n/a' && 
                   $scope.currentNode.healthCheck.status.last_sync_integrity.date_end_master   !== 'n/a') {
                    const end = new Date($scope.currentNode.healthCheck.status.last_sync_integrity.date_end_master);
                    const start = new Date($scope.currentNode.healthCheck.status.last_sync_integrity.date_start_master)
                    $scope.currentNode.healthCheck.status.last_sync_integrity.duration = `${(end - start) / 1000}s`;
                }
                
                if($scope.currentNode.healthCheck.status.last_sync_agentinfo.date_start_master !== 'n/a' && 
                   $scope.currentNode.healthCheck.status.last_sync_agentinfo.date_end_master   !== 'n/a') {
                    const end = new Date($scope.currentNode.healthCheck.status.last_sync_agentinfo.date_end_master);
                    const start = new Date($scope.currentNode.healthCheck.status.last_sync_agentinfo.date_start_master)
                    $scope.currentNode.healthCheck.status.last_sync_agentinfo.duration = `${(end - start) / 1000}s`;
                }
                
                if($scope.currentNode.healthCheck.status.last_sync_agentgroups.date_start_master !== 'n/a' && 
                   $scope.currentNode.healthCheck.status.last_sync_agentgroups.date_end_master   !== 'n/a') {
                    const end = new Date($scope.currentNode.healthCheck.status.last_sync_agentgroups.date_end_master);
                    const start = new Date($scope.currentNode.healthCheck.status.last_sync_agentgroups.date_start_master)
                    $scope.currentNode.healthCheck.status.last_sync_agentgroups.duration = `${(end - start) / 1000}s`;
                }
            }

            assignFilters($scope.currentNode.name);
            $rootScope.$broadcast('updateVis');

            if(!$scope.$$phase) $scope.$digest();
        } catch(error) {
            errorHandler.handle(error,'Cluster')
        }

    })

    let filters = [];
    const assignFilters = (node = false) => {
        try{

            filters = [];
            filters.push(filterHandler.managerQuery(
                appState.getClusterInfo().cluster, 
                true
            ))
            if(node){
                filters.push(filterHandler.nodeQuery(node))
            }

            $rootScope.$emit('wzEventFilters',{ filters, localChange: false });
            if(!$rootScope.$$listenerCount['wzEventFilters']){
                $timeout(100)
                .then(() => assignFilters(node))
            }
        } catch(error) {
            errorHandler.handle('An error occurred while creating custom filters for visualizations','Cluster',true);
        }
    }

    const load = async () => {
        try {

            visHandlers.removeAll();
            discoverPendingUpdates.removeAll();
            rawVisualizations.removeAll();
            loadedVisualizations.removeAll();


            const status = await apiReq.request('GET','/cluster/status',{});
            $scope.status = status.data.data.running;
            if($scope.status === 'no') {
                $scope.isClusterRunning = false;
                throw new Error('Cluster is not running');
            }

            const data = await Promise.all([
                apiReq.request('GET','/cluster/nodes',{}),
                apiReq.request('GET','/cluster/config',{}),
                apiReq.request('GET','/version',{}),
                apiReq.request('GET','/agents',{limit:1}),
                apiReq.request('GET','/cluster/healthcheck',{})
            ]);

            const nodesCount = data[0].data.data.totalItems;
            $scope.nodesCount = nodesCount;

            const configuration = data[1];
            $scope.configuration = configuration.data.data;
            
            const version = data[2];
            $scope.version = version.data.data;

            const agents = data[3];
            $scope.agentsCount = agents.data.data.totalItems - 1;

            const health = data[4];
            $scope.healthCheck = health.data.data;

            const nodes = data[0].data.data;

            nodes.name        = $scope.configuration.name;
            nodes.master_node = $scope.configuration.node_name;

            const visData = await genericReq.request('POST',`/api/wazuh-elastic/create-vis/cluster-monitoring/${appState.getCurrentPattern()}`,{ nodes })
    
            rawVisualizations.assignItems(visData.data.raw);
            assignFilters();
            $rootScope.$broadcast('updateVis');

            $scope.loading = false;
            if(!$scope.$$phase) $scope.$digest();
            return;
        } catch(error) {
            $scope.loading = false;
            errorHandler.handle(error,'Cluster');
        }
    }

    if(clusterEnabled) load();

    $scope.$on('$destroy',() => {
        $location.search('tabView',null);
        discoverPendingUpdates.removeAll();
        tabVisualizations.removeAll();
        rawVisualizations.removeAll();
        loadedVisualizations.removeAll();
        visHandlers.removeAll();
    })

});
