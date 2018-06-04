/*
 * Wazuh app - Groups controller
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import beautifier   from 'plugins/wazuh/utils/json-beautifier';
import * as modules from 'ui/modules'
import CsvGenerator from './csv-generator'

const app = modules.get('app/wazuh', []);

// Groups preview controller
app.controller('groupsPreviewController',
function ($scope, $rootScope, $location, apiReq, Groups, GroupFiles, GroupAgents, errorHandler, csvReq, appState, shareAgent) {
    $scope.$on('groupsIsReloaded',() => {        
        $scope.lookingGroup = false;
        if(!$scope.$$phase) $scope.$digest();
    });

    $scope.searchTerm      = '';
    $scope.searchTermAgent = '';
    $scope.searchTermFile  = '';
    $scope.load            = true;
    $scope.groups          = Groups;
    $scope.groupAgents     = GroupAgents;
    $scope.groupFiles      = GroupFiles;

    $scope.downloadCsv = async dataProvider => {
        try {
            const path         = $scope[dataProvider] ? $scope[dataProvider].path : null;
            const currentApi   = JSON.parse(appState.getCurrentAPI()).id;
            const output       = await csvReq.fetch(path, currentApi, $scope[dataProvider] ? $scope[dataProvider].filters : null);
            const csvGenerator = new CsvGenerator(output.csv, 'groups.csv');
            csvGenerator.download(true);
        } catch (error) {
            errorHandler.handle(error,'Download CSV');
            if(!$rootScope.$$phase) $rootScope.$digest();
        }
    }

    // Store a boolean variable to check if come from agents
    const globalAgent = shareAgent.getAgent();

    const load = async () => {
        try {
            // If come from agents
            if(globalAgent) {
                let len = 0;
                // Get ALL groups
                const data = await apiReq.request('GET','/agents/groups/',{limit:99999})

                // Obtain an array with 0 or 1 element, in that case is our group
                const filtered = data.data.data.items.filter(group => group.name === globalAgent.group);
                // Store the array length, should be 0 or 1
                len = filtered.length;
                // If len is 1
                if(len){
                    // First element is now our group $scope.groups.item is an array with only our group
                    $scope.groups.items = filtered;
                    // Load that our group
                    $scope.loadGroup(0,true);
                    $scope.lookingGroup=true
                }
                // Clean $rootScope
                shareAgent.deleteAgent();
                // Get more groups to fill the md-content with more items
                await $scope.groups.nextPage();

                // If our group was not found  we need to call loadGroup after load some groups
                if(!len) {
                    $scope.loadGroup(0,true);
                    $scope.lookingGroup=true
                }

            // If not come from agents make as normal
            } else {
                // Actual execution in the controller's initialization
                await $scope.groups.nextPage();
                $scope.loadGroup(0,true);
            }

            $scope.load = false;

            if(!$scope.$$phase) $scope.$digest();
            return;
        } catch (error) {
            errorHandler.handle(error,'Groups');
            if(!$rootScope.$$phase) $rootScope.$digest();
        }
    }

    load();

    $scope.toggle = () => $scope.lookingGroup=true;

    $scope.showFiles = index => {
        $scope.fileViewer = false;
        $scope.groupFiles.reset();
        $scope.groupFiles.path = `/agents/groups/${$scope.groups.items[index].name}/files`;
        $scope.groupFiles.nextPage('');
    };

    $scope.showAgents = index => {
        $scope.fileViewer = false;
        $scope.groupAgents.reset();
        $scope.groupAgents.path = `/agents/groups/${$scope.groups.items[index].name}`;
        $scope.groupAgents.nextPage('');
    };

    $scope.showAgent = agent => {
        $rootScope.globalAgent = agent.id;
        $rootScope.comeFrom    = 'groups';
        $location.search('tab', null);
        $location.path('/agents');
    };

    $scope.loadGroup = (index,firstTime) => {
        if(!firstTime) $scope.lookingGroup=true;
        $scope.fileViewer = false;
        $scope.groupAgents.reset();
        $scope.groupFiles.reset();
        $scope.selectedGroup = index;
        $scope.showFiles(index);
        $scope.showAgents(index);
    };

    // Select specific group
    $scope.checkSelected = index => {
        for(let group of $scope.groups.items){
            if (group.selected) {
                group = false;
            }
        }
        $scope.groups.items[index] = true;
    };


    $scope.goBackToAgents = () => {
        $scope.groupsSelectedTab = 'agents';
        $scope.file     = false;
        $scope.filename = false;
        if(!$scope.$$phase) $scope.$digest();
    }

    $scope.goBackFiles = () => {
        $scope.groupsSelectedTab = 'files';
        $scope.file     = false;
        $scope.filename = false;
        if(!$scope.$$phase) $scope.$digest();
    }

    $scope.goBackGroups = () => {
        $scope.lookingGroup = false;
        if(!$scope.$$phase) $scope.$digest();
    }

    $scope.showFile = async index => {
        try {
            if($scope.filename) $scope.filename = '';
            let filename = $scope.groupFiles.items[index].filename;
            if(filename === '../ar.conf') filename = 'ar.conf';

            $scope.fileViewer = true;

            const tmpName = `/agents/groups/${$scope.groups.items[$scope.selectedGroup].name}`+
                          `/files/${filename}`;


            const data = await apiReq.request('GET', tmpName, {})

            $scope.file = beautifier.prettyPrint(data.data.data);
            $scope.filename = filename;

            if(!$scope.$$phase) $scope.$digest();
            return;
        } catch (error) {
            errorHandler.handle(error,'Groups');
            if(!$rootScope.$$phase) $rootScope.$digest();
        }
    };

    // Changing the view to overview a specific group
    $scope.groupOverview = group => {
        $scope.$parent.$parent.groupName  = group;
        $scope.$parent.$parent.groupsMenu = 'overview';
    };

    // Resetting the factory configuration
    $scope.$on("$destroy", () => {
        $scope.groups.reset();
        $scope.groupFiles.reset();
        $scope.groupAgents.reset();
    });


    $scope.$watch('lookingGroup',value => {
        if(!value){
            $scope.file     = false;
            $scope.filename = false;
        }
    });
});

app.controller('groupsController', function ($scope,$rootScope) {
    $scope.groupsMenu = 'preview';
    $scope.groupName  = '';
    $scope.$on("$destroy", () => {

    });
});
