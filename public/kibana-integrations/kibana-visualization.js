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
            controller: function VisController($scope, $rootScope, $location, wzsavedVisualizations, genericReq, errorHandler, Private, rawVisualizations, loadedVisualizations, tabVisualizations, discoverPendingUpdates, visHandlers) {

                let originalImplicitFilter = '';
                let implicitFilter         = '';
                let rendered               = false;
                let visualization          = null;
                let visHandler             = null;
                let renderInProgress       = false;

                const myRender = raw => {
                    if (raw && discoverPendingUpdates.getList().length) { // There are pending updates from the discover (which is the one who owns the true app state)
                        const discoverList = discoverPendingUpdates.getList();
                        if(!visualization && !rendered && !renderInProgress) { // There's no visualization object -> create it with proper filters
                            renderInProgress = true;

                            const rawVis = raw.filter(item => item && item.id === $scope.visID);
                            wzsavedVisualizations.get($scope.visID,rawVis[0]).then(savedObj => {
                                originalImplicitFilter = savedObj.searchSource.get('query')['query'];
                                visualization = savedObj;

                                // There's an original filter
                                if (originalImplicitFilter.length > 0 ) {
                                    // And also a pending one -> concatenate them
                                    if (typeof discoverList[0].query === 'string' && discoverList[0].query.length > 0) {
                                        implicitFilter = originalImplicitFilter + ' AND ' + discoverList[0].query;
                                    } else {
                                        // Only the original filter
                                        implicitFilter = originalImplicitFilter;
                                    }
                                } else {
                                    // Other case, use the pending one, if it is empty, it won't matter
                                    implicitFilter = discoverList ? discoverList[0].query : '';
                                }

                                if ($scope.visID !== 'Wazuh-App-Overview-General-Agents-status' && !$scope.visID.includes('Cluster')) { // We don't want to filter that visualization as it uses another index-pattern
                                    visualization.searchSource
                                    .query({ language: 'lucene', query: implicitFilter })
                                    .set('filter',  discoverList.length > 1 ? discoverList[1] : {});
                                } else if($scope.visID.includes('Cluster')) {
                                    // Checks for cluster.name and cluster.node filters existence 
                                    const clusterFilters = discoverList[1].filter(item => item && item.meta && item.meta.key && (item.meta.key.includes('cluster.name') || item.meta.key.includes('cluster.node')));
                                    
                                    // Applying specific filter to cluster visualziations status
                                    if(Array.isArray(clusterFilters) && clusterFilters.length) {
                                        for(const clusterFilter of clusterFilters){
                                            visualization.searchSource.filter(clusterFilter);
                                        }                                    
                                    }
                                } else {
                                    
                                    // Checks for cluster.name filter existence 
                                    const monitoringFilter = discoverList[1].filter(item => item && item.meta && item.meta.key && item.meta.key.includes('cluster.name'));
                                    
                                    // Applying specific filter to Agents status
                                    if(Array.isArray(monitoringFilter) && monitoringFilter.length) {
                                        visualization.searchSource.filter(monitoringFilter[0]);
                                    }
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
          
                                visHandlers.addItem(visHandler);
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
                                if (discoverList[0].query === 'string' && discoverList[0].query.length > 0) {
                                    implicitFilter = originalImplicitFilter + ' AND ' + discoverList[0].query;
                                } else {
                                    // Only the original filter
                                    implicitFilter = originalImplicitFilter;
                                }
                            } else {
                                // Other case, use the pending one, if it is empty, it won't matter
                                implicitFilter = discoverList ? discoverList[0].query : '';
                            }
                            
                            if ($scope.visID !== 'Wazuh-App-Overview-General-Agents-status') { // We don't want to filter that visualization as it uses another index-pattern
                                visualization.searchSource
                                .query({ language: 'lucene', query: implicitFilter })
                                .set('filter', discoverList.length > 1 ? discoverList[1] : {});
                            } else if($scope.visID.includes('Cluster')) {
                                // Checks for cluster.name and cluster.node filters existence 
                                const clusterFilters = discoverList[1].filter(item => item && item.meta && item.meta.key && (item.meta.key.includes('cluster.name') || item.meta.key.includes('cluster.node')));
                                
                                // Applying specific filter to cluster visualziations status
                                if(Array.isArray(clusterFilters) && clusterFilters.length) {
                                    for(const clusterFilter of clusterFilters){
                                        visualization.searchSource.filter(clusterFilter);
                                    }                                    
                                }
                            } else {
                                    
                                // Checks for cluster.name filter existence 
                                const monitoringFilter = discoverList[1].filter(item => item && item.meta && item.meta.key && item.meta.key.includes('cluster.name'));
                                
                                // Applying specific filter to Agents status
                                if(Array.isArray(monitoringFilter) && monitoringFilter.length) {
                                    visualization.searchSource.filter(monitoringFilter[0]);
                                }
                            }
                        }
                    }
                };

                // Listen for changes
                const updateVisWatcher = $rootScope.$on('updateVis', () => {
                    if(!$rootScope.$$phase) $rootScope.$digest();
                    const rawVis = rawVisualizations.getList();
                    if(Array.isArray(rawVis) && rawVis.length){
                        myRender(rawVis);
                    }
                });

                $scope.$on('$destroy',() => {
                    updateVisWatcher();
                })

                const renderComplete = () => {
                    rendered = true;

                    loadedVisualizations.addItem(true);

                    let currentCompleted = Math.round((loadedVisualizations.getList().length / tabVisualizations.getItem(tabVisualizations.getTab())) * 100);
                    $rootScope.loadingStatus = `Rendering visualizations... ${currentCompleted > 100 ? 100 : currentCompleted} %`;

                    if (currentCompleted >= 100) {
                        
                        if ($scope.visID !== 'Wazuh-App-Overview-General-Agents-status') { 
                            const thereIsData   = visHandlers.hasData();
                            $rootScope.rendered = thereIsData;
                            if(!thereIsData) $rootScope.resultState = 'none'
                        }
                        // Forcing a digest cycle
                        if(!$rootScope.$$phase) $rootScope.$digest();
                    }
                    else if ($scope.visID !== 'Wazuh-App-Overview-General-Agents-status') $rootScope.rendered = false;
                };

                // Initializing the visualization
                const loader = ownLoader.getVisualizeLoader();
            }
        }
    }]);