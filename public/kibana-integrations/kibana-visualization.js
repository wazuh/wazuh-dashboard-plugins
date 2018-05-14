/*
 * Wazuh app - Custom visualization directive
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import $              from 'jquery';
import * as modules   from 'ui/modules'
import * as ownLoader from './loader/loader-import'

const app = modules.get('apps/webinar_app', [])
    .directive('kbnVis', [function () {
        return {
            restrict: 'E',
            scope: {
                visID: '=visId',
                specificTimeRange: '=specificTimeRange'
            },
            controller: function VisController($scope, $rootScope, $location, wzsavedVisualizations, genericReq, errorHandler,Private) {
                if(!$rootScope.ownHandlers) $rootScope.ownHandlers = [];
                let originalImplicitFilter = '';
                let implicitFilter         = '';
                let visTitle               = '';
                let fullFilter             = '';
                let rendered               = false;
                let visualization          = null;
                let visHandler             = null;
                let renderInProgress       = false;

                const myRender = raw => {
                   
                    if (raw && (($rootScope.discoverPendingUpdates && $rootScope.discoverPendingUpdates.length != 0) || $scope.visID.includes('Ruleset') ) ) { // There are pending updates from the discover (which is the one who owns the true app state)
                        if(!visualization && !rendered && !renderInProgress) { // There's no visualization object -> create it with proper filters
                            renderInProgress = true;

                            const rawVis = raw.filter(item => item.id === $scope.visID);
                            wzsavedVisualizations.get($scope.visID,rawVis[0]).then(savedObj => {
                                originalImplicitFilter = savedObj.searchSource.get('query')['query'];
                                visTitle = savedObj.vis.title;
                                visualization = savedObj;

                                // There's an original filter
                                if (originalImplicitFilter.length > 0 ) {
                                    // And also a pending one -> concatenate them
                                    if ($rootScope.discoverPendingUpdates && typeof $rootScope.discoverPendingUpdates[0].query === 'string' && $rootScope.discoverPendingUpdates[0].query.length > 0) {
                                        implicitFilter = originalImplicitFilter + ' AND ' + $rootScope.discoverPendingUpdates[0].query;
                                    } else {
                                        // Only the original filter
                                        implicitFilter = originalImplicitFilter;
                                    }
                                } else {
                                    // Other case, use the pending one, if it is empty, it won't matter
                                    implicitFilter = $rootScope.discoverPendingUpdates ? $rootScope.discoverPendingUpdates[0].query : '';
                                }

                                if (visTitle !== 'Wazuh App Overview General Agents status') { // We don't want to filter that visualization as it uses another index-pattern
                                    visualization.searchSource
                                    .query({ language: 'lucene', query: implicitFilter })
                                    .set('filter',  $rootScope.discoverPendingUpdates ? $rootScope.discoverPendingUpdates[1] : {});
                                }

                                let params = {};

                                if ($scope.specificTimeRange) {
                                    const timeRange = {
                                        from: 'now-1d/d',
                                        to: 'now'
                                    };
                                    params = {timeRange: timeRange}
                                }
                                $(`[vis-id="'${$scope.visID}'"]`).on('renderStart', () => {
                                //$("#"+$scope.visID).on('renderStart', () => {
                                    // TBD: Use renderStart to couple it with renderComplete?
                                });
    
                                visHandler = loader.embedVisualizationWithSavedObject($(`[vis-id="'${$scope.visID}'"]`), visualization, params); 
                                
                                $rootScope.ownHandlers.push(visHandler);
                                visHandler.addRenderCompleteListener(renderComplete);
                            }).catch(error => {
                                if(error && error.message && error.message.includes('not locate that index-pattern-field')){
                                    errorHandler.handle(`${error.message}, please restart Kibana and refresh this page once done`,'Visualize')
                                } else {
                                    errorHandler.handle(error,'Visualize')
                                }
                            });     
                            
                        } else if (rendered) { // There's a visualization object -> just update its filters

                            // There's an original filter
                            if (originalImplicitFilter.length > 0 ) {
                                // And also a pending one -> concatenate them
                                if ($rootScope.discoverPendingUpdates && typeof $rootScope.discoverPendingUpdates[0].query === 'string' && $rootScope.discoverPendingUpdates[0].query.length > 0) {
                                    implicitFilter = originalImplicitFilter + ' AND ' + $rootScope.discoverPendingUpdates[0].query;
                                } else {
                                    // Only the original filter
                                    implicitFilter = originalImplicitFilter;
                                }
                            } else {
                                // Other case, use the pending one, if it is empty, it won't matter
                                implicitFilter = $rootScope.discoverPendingUpdates ? $rootScope.discoverPendingUpdates[0].query : '';
                            }
                            
                            if (visTitle !== 'Wazuh App Overview General Agents status') { // We don't want to filter that visualization as it uses another index-pattern
                                visualization.searchSource
                                .query({ language: 'lucene', query: implicitFilter })
                                .set('filter', $rootScope.discoverPendingUpdates ? $rootScope.discoverPendingUpdates[1] : {});
                            }
                        }
                    }
                };

                // Listen for changes
                $rootScope.$on('updateVis', function (event, query, filters) {
                    if(!$rootScope.$$phase) $rootScope.$digest();
                    myRender($rootScope.rawVisualizations);
                });

                var renderComplete = function() {
                    rendered = true;
                    
                    if(typeof $rootScope.loadedVisualizations === 'undefined') $rootScope.loadedVisualizations = [];
                    $rootScope.loadedVisualizations.push(true);
                    let currentCompleted = Math.round(($rootScope.loadedVisualizations.length / $rootScope.tabVisualizations[$location.search().tab]) * 100);
                    $rootScope.loadingStatus = `Rendering visualizations... ${currentCompleted > 100 ? 100 : currentCompleted} %`;

                    if (currentCompleted >= 100) {

                        if (!visTitle !== 'Wazuh App Overview General Agents status') $rootScope.rendered = true;
                        // Forcing a digest cycle
                        if(!$rootScope.$$phase) $rootScope.$digest();
                    }
                    else if (!visTitle !== 'Wazuh App Overview General Agents status') $rootScope.rendered = false;
                };

                // Initializing the visualization
                const loader = ownLoader.getVisualizeLoader();
            }
        }
    }]);