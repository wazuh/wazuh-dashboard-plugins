/*
 * Wazuh app - Agents preview controller
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { uiModules }  from 'ui/modules'
import * as FileSaver from '../services/file-saver'

const app = uiModules.get('app/wazuh', []);

app.controller('agentsPreviewController', function ($scope, $routeParams, genericReq, appState, $location, errorHandler, csvReq, shareAgent) {
    
    $scope.search = term => {
        $scope.$broadcast('wazuhSearch',{term})
    }
   
    $scope.filter = filter => {
        $scope.$broadcast('wazuhFilter',{filter})
    }

    $scope.isClusterEnabled = appState.getClusterInfo() && appState.getClusterInfo().status === 'enabled'
    $scope.loading     = true;

    $scope.status      = 'all';
    $scope.osPlatform  = 'all';
    $scope.version     = 'all'
    $scope.osPlatforms = [];
    $scope.versions    = [];
    $scope.groups      = [];
    $scope.nodes       = [];
    $scope.node_name   = 'all';
    $scope.mostActiveAgent = {
        name: '',
        id  : ''
    };

    // Load URL params
    if ($routeParams.tab){
        $scope.submenuNavItem = $routeParams.tab;
    }

    // Watcher for URL params
    $scope.$watch('submenuNavItem', () => {
        $location.search('tab', $scope.submenuNavItem);
    });

    $scope.downloadCsv = async () => {
        try {
            errorHandler.info('Your download should begin automatically...', 'CSV')
            const currentApi   = JSON.parse(appState.getCurrentAPI()).id;
            const output       = await csvReq.fetch('/agents', currentApi, null);
            const blob         = new Blob([output], {type: 'text/csv'});

            FileSaver.saveAs(blob, 'agents.csv');

            return;

        } catch (error) {
            errorHandler.handle(error,'Download CSV');
        }
        return;
    }

    const load = async () => {
        try{
            const api = JSON.parse(appState.getCurrentAPI()).id
            const clusterInfo    = appState.getClusterInfo();
            const firstUrlParam  = clusterInfo.status === 'enabled' ? 'cluster' : 'manager';
            const secondUrlParam = clusterInfo[firstUrlParam];

            const data = await Promise.all([
                genericReq.request('GET', '/api/wazuh-api/agents-unique/' + api, {}),
                genericReq.request('GET', `/api/wazuh-elastic/top/${firstUrlParam}/${secondUrlParam}/agent.name`)                
            ]);
            
            const unique = data[0].data.result;

            $scope.groups                    = unique.groups;
            $scope.nodes                     = unique.nodes;
            $scope.versions                  = unique.versions;
            $scope.osPlatforms               = unique.osPlatforms;
            $scope.lastAgent                 = unique.lastAgent;
            $scope.agentsCountActive         = unique.summary.agentsCountActive;
            $scope.agentsCountDisconnected   = unique.summary.agentsCountDisconnected;
            $scope.agentsCountNeverConnected = unique.summary.agentsCountNeverConnected;
            $scope.agentsCountTotal          = unique.summary.agentsCountTotal;
            $scope.agentsCoverity            = unique.summary.agentsCoverity;

            if (data[1].data.data === '') {
                $scope.mostActiveAgent.name = appState.getClusterInfo().manager;
                $scope.mostActiveAgent.id   = '000';
            } else {
                $scope.mostActiveAgent.name = data[1].data.data;
                const info = await genericReq.request('GET', `/api/wazuh-elastic/top/${firstUrlParam}/${secondUrlParam}/agent.id`);
                if (info.data.data === '' && $scope.mostActiveAgent.name !== '') {
                    $scope.mostActiveAgent.id = '000';
                } else {
                    $scope.mostActiveAgent.id = info.data.data;
                }
            }

            $scope.loading = false;
            if(!$scope.$$phase) $scope.$digest();
            return;
        } catch (error) {
            errorHandler.handle(error,'Agents Preview');
        }
        return;
    };

    $scope.showAgent = agent => {
        shareAgent.setAgent(agent);
        $location.path('/agents');
    }

    //Load
    load();

});
