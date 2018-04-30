/*
 * Wazuh app - Top nav bar directive
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import menuTemplate from './wz-menu.html'
import * as modules from 'ui/modules'

const app = modules.get('app/wazuh', []);;

app.directive('wzMenu',function(){
    return {
        controller: function ($scope, $window, $rootScope, appState, patternHandler, courier, errorHandler,genericReq,$location) {

            $rootScope.showSelector = appState.getPatternSelector();

            if(!$rootScope.$$phase) $rootScope.$digest();

            if(appState.getCurrentAPI()) {
                $scope.theresAPI = true;
                $scope.currentAPI = JSON.parse(appState.getCurrentAPI()).name;
            }
            else {
                $scope.theresAPI = false;
            }

            $scope.goToClick = path => {
                $window.location.href = path;
            }

            const load = async () => {
                try {
                    // Get the configuration to check if pattern selector is enabled
                    const config = await genericReq.request('GET', '/api/wazuh-api/configuration', {});
                    appState.setPatternSelector(typeof config.data.data['ip.selector'] !== 'undefined' ? config.data.data['ip.selector'] : true)

                    // Abort if we have disabled the pattern selector
                    if(!appState.getPatternSelector()) return;

                    // Show the pattern selector
                    $rootScope.showSelector = true;
                    let filtered = false;
                    // If there is no current pattern, fetch it
                    if(!appState.getCurrentPattern()) {
                        const currentPattern = await genericReq.request('GET', '/get-list');
                        if(!currentPattern.data.data.length){
                            $rootScope.blankScreenError = 'Sorry but no valid index patterns were found'
                            $location.search('tab',null);
                            $location.path('/blank-screen');
                            return;
                        }
                        appState.setCurrentPattern(currentPattern.data.data[0].id);
                    } else {

                        // If there is current pattern, check if there is some pattern
                        const patternList = await genericReq.request('GET', '/get-list');

                        if(!patternList.data.data.length){
                            $rootScope.blankScreenError = 'Sorry but no valid index patterns were found'
                            $location.search('tab',null);
                            $location.path('/blank-screen');
                            return;
                        }

                        // Check if the current pattern cookie is valid
                        filtered = patternList.data.data.filter(item => item.id.includes(appState.getCurrentPattern()))
                        if(!filtered.length) appState.setCurrentPattern(patternList.data.data[0].id)
                    }

                    const data = filtered ? filtered : await courier.indexPatterns.get(appState.getCurrentPattern());
                    $scope.theresPattern = true;
                    $scope.currentPattern = data.title;
                    const list = await patternHandler.getPatternList();

                    // Getting the list of index patterns
                    if(list) {
                        $scope.patternList = list;
                        $scope.currentSelectedPattern = appState.getCurrentPattern();
                    }
                    if(!$scope.$$phase) $scope.$digest();
                    if(!$rootScope.$$phase) $rootScope.$digest();
                    return;
                } catch (error) {
                    errorHandler.handle(error,'Directives - Menu');
                    $scope.theresPattern = false;
                    if(!$rootScope.$$phase) $rootScope.$digest();
                }
            }

            load();

            // Function to change the current index pattern on the app
            $scope.changePattern = async selectedPattern => {
                try{
                    if(!appState.getPatternSelector()) return;
                    $scope.currentSelectedPattern = await patternHandler.changePattern(selectedPattern);
                    if(!$scope.$$phase) $scope.$digest();
                    $window.location.reload();
                    return;
                }catch(error){
                    errorHandler.handle(error,'Directives - Menu');
                    if(!$rootScope.$$phase) $rootScope.$digest();
                }
            }

            $scope.$on('updateAPI', () => {
                if(appState.getCurrentAPI())
                {
                    $scope.theresAPI = true;
                    $scope.currentAPI = JSON.parse(appState.getCurrentAPI()).name;
                }
                else {
                    $scope.theresAPI = false;
                }
            });

            $scope.$on('updatePattern', () => {
                if(!appState.getPatternSelector()) return;
                courier.indexPatterns.get(appState.getCurrentPattern())
                .then(data => {
                    $scope.theresPattern = true;
                    $scope.currentSelectedPattern = appState.getCurrentPattern();
                })
                .catch(error => {
                    errorHandler.handle(error,'Directives - Menu');
                    if(!$rootScope.$$phase) $rootScope.$digest();
                    $scope.theresPattern = false;
                });
            });
        },
        template: menuTemplate
    };
});
