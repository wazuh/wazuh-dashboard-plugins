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
import * as modules   from 'ui/modules'
import * as FileSaver from '../services/file-saver'

const app = modules.get('app/wazuh', []);

app.controller('agentsPreviewController', function ($scope, $rootScope, $routeParams, genericReq, apiReq, appState, Agents, $location, errorHandler, csvReq, shareAgent) {
    $scope.isClusterEnabled = appState.getClusterInfo() && appState.getClusterInfo().status === 'enabled'
    $scope.loading     = true;
    $scope.agents      = Agents;
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

    let tmpUrl, tmpUrl2;
    if (appState.getClusterInfo().status === 'enabled') {
        tmpUrl  = `/api/wazuh-elastic/top/cluster/${appState.getClusterInfo().cluster}/agent.name`;
        tmpUrl2 = `/api/wazuh-elastic/top/cluster/${appState.getClusterInfo().cluster}/agent.id`;
    } else {
        tmpUrl  = `/api/wazuh-elastic/top/manager/${appState.getClusterInfo().manager}/agent.name`;
        tmpUrl2 = `/api/wazuh-elastic/top/manager/${appState.getClusterInfo().manager}/agent.id`;
    }

    $scope.applyFilters = filter => {
        if(filter.includes('Unknown')){
            $scope.agents.addFilter('status','Never connected');

        /** Pending API implementation */
        //} else if(filter.includes('group-')){
        //    $scope.agents.addFilter('group',filter.split('group-')[1]);

        } else if(filter.includes('node-')){
            $scope.agents.addFilter('node',filter.split('node-')[1]);
        } else if(filter.includes('version-')) {
            $scope.agents.addFilter('version',filter.split('version-')[1]);
        } else {
            const platform = filter.split(' - ')[0];
            const version  = filter.split(' - ')[1];
            $scope.agents.addMultipleFilters([
                { name:  'os.platform', value: platform },
                { name:  'os.version', value: version }
            ]);
        }
    }

    // Retrieve os list
    const retrieveList = agents => {
        for(const agent of agents){
            if(agent.id === '000') continue;
            if(agent.group && !$scope.groups.includes(agent.group)) $scope.groups.push(agent.group);
            if(agent.node_name && !$scope.nodes.includes(agent.node_name)) $scope.nodes.push(agent.node_name);
            if(agent.version && !$scope.versions.includes(agent.version)) $scope.versions.push(agent.version);
            if(agent.os && agent.os.name){
                const exists = $scope.osPlatforms.filter((e) => e.name === agent.os.name && e.platform === agent.os.platform && e.version === agent.os.version);
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

    $scope.downloadCsv = async () => {
        try {
            errorHandler.info('Your download should begin automatically...', 'CSV')
            const currentApi   = JSON.parse(appState.getCurrentAPI()).id;
            const output       = await csvReq.fetch('/agents', currentApi, $scope.agents ? $scope.agents.filters : null);
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
            const data = await Promise.all([
                $scope.agents.nextPage(),
                apiReq.request('GET', '/agents/summary', { }),
                genericReq.request('GET', tmpUrl),
                apiReq.request('GET', '/agents', { sort:'-date_add', limit:9999999 })
            ]);

            // Agents summary
            if(parseInt(data[1].data.data['Never connected']) > 0){
                $scope.osPlatforms.push({
                    name:     'Unknown',
                    platform: 'Unknown',
                    version:  ''
                });
            }

            // Once Wazuh core fixes agent 000 issues, this should be adjusted
            const active = data[1].data.data.Active - 1;
            const total  = data[1].data.data.Total - 1;

            $scope.agentsCountActive         = active;
            $scope.agentsCountDisconnected   = data[1].data.data.Disconnected;
            $scope.agentsCountNeverConnected = data[1].data.data['Never connected'];
            $scope.agentsCountTotal          = total;
            $scope.agentsCoverity            = (active / total) * 100;

            // tmpUrl y tmpUrl2
            if (data[2].data.data === '') {
                $scope.mostActiveAgent.name = appState.getClusterInfo().manager;
                $scope.mostActiveAgent.id   = '000';
            } else {
                $scope.mostActiveAgent.name = data[2].data.data;
                const info = await genericReq.request('GET', tmpUrl2);
                if (info.data.data === '' && $scope.mostActiveAgent.name !== '') {
                    $scope.mostActiveAgent.id = '000';
                } else {
                    $scope.mostActiveAgent.id = info.data.data;
                }
            }

            // Last agent
            $scope.lastAgent = data[3].data.data.items[0];

            retrieveList(data[3].data.data.items);

            $scope.loading = false;
            if(!$scope.$$phase) $scope.$digest();
            return;
        } catch (error) {
            errorHandler.handle(error,'Agents Preview');
        }
        return;
    };

    $scope.goGroup = agent => {
        shareAgent.setAgent(agent);
        $location.search('tab', 'groups');
        $location.path('/manager');
    };

    $scope.showAgent = agent => {
        shareAgent.setAgent(agent);
        $location.path('/agents');
    };

    //Load
    load();

    //Destroy
    $scope.$on("$destroy", () => $scope.agents.reset());
});
