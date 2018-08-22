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
import { uiModules }   from 'ui/modules';
import { getVisualizeLoader } from './loader';
import { timefilter } from 'ui/timefilter'
const app = uiModules.get('apps/webinar_app', []);

app.directive('kbnVis', [function () {
    return {
        restrict: 'E',
        scope: {
            visID: '=visId',
            specificTimeRange: '=specificTimeRange'
        },
        controller: function VisController($scope, $rootScope, wzsavedVisualizations, errorHandler, rawVisualizations, loadedVisualizations, tabVisualizations, discoverPendingUpdates, visHandlers) {

            let implicitFilter         = '';
            let rawFilters             = [];
            let rendered               = false;
            let visualization          = null;
            let visHandler             = null;
            let renderInProgress       = false;

            const setSearchSource = discoverList => {
                try {
       
                    if ($scope.visID !== 'Wazuh-App-Overview-General-Agents-status' && !$scope.visID.includes('Cluster')) {
                        visualization.searchSource
                            .setField('query',{ language: discoverList[0].language || 'lucene', query: implicitFilter })
                            .setField('filter', discoverList.length > 1 ? [...discoverList[1], ...rawFilters] : rawFilters);
                     } else {
                        // Checks for cluster.name or cluster.node filter existence 
                        const monitoringFilter = discoverList[1].filter(item => item && item.meta && item.meta.key && (item.meta.key.includes('cluster.name') || item.meta.key.includes('cluster.node')));
                        
                        // Applying specific filter to cluster monitoring vis
                        if (Array.isArray(monitoringFilter) && monitoringFilter.length) {
                            visualization.searchSource.setField('filter',monitoringFilter);
                        }
                    }

                } catch (error) {
                    errorHandler.handle(error,'Visualize - setSearchSource');
                }

            };

            const myRender = async raw => {
                try {
                    if(!loader) {
                        loader = await getVisualizeLoader()
                    }

                    const discoverList = discoverPendingUpdates.getList();

                    if (raw && discoverList.length) { // There are pending updates from the discover (which is the one who owns the true app state)
    
                        if(!visualization && !rendered && !renderInProgress) { // There's no visualization object -> create it with proper filters
                            renderInProgress = true;
                            const rawVis     = raw.filter(item => item && item.id === $scope.visID);
                            visualization    = await wzsavedVisualizations.get($scope.visID,rawVis[0]);
                            rawFilters       = visualization.searchSource.getField('filter');                           
                            
                            // Other case, use the pending one, if it is empty, it won't matter
                            implicitFilter = discoverList ? discoverList[0].query : '';
                 
                            setSearchSource(discoverList);
                            
                            visHandler = loader.embedVisualizationWithSavedObject($(`[vis-id="'${$scope.visID}'"]`)[0], visualization, { }); 
                            visHandler.update({
                                timeRange: timefilter.getTime(),
                            })
                            visHandlers.addItem(visHandler);
                            visHandler.addRenderCompleteListener(renderComplete);
              
                        } else if (rendered) { // There's a visualization object -> just update its filters
                        
                            // Use the pending one, if it is empty, it won't matter
                            implicitFilter = discoverList ? discoverList[0].query : '';
                            visHandler.update({
                                timeRange: timefilter.getTime(),
                            })
                            setSearchSource(discoverList);
                        }
                    }
                } catch (error) {
                    if(error && error.message && error.message.includes('not locate that index-pattern-field')){
                        errorHandler.handle(`${error.message}, please restart Kibana and refresh this page once done`,'Visualize');
                    } else {
                        errorHandler.handle(error,'Visualize');
                    }
                }

                return; 
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
                updateVisWatcher()
                visualization.destroy();
                visHandler.destroy();
            });

            const renderComplete = () => {
                rendered = true;
                loadedVisualizations.addItem(true);
                const currentCompleted = Math.round((loadedVisualizations.getList().length / tabVisualizations.getItem(tabVisualizations.getTab())) * 100);
                $rootScope.loadingStatus = `Rendering visualizations... ${currentCompleted > 100 ? 100 : currentCompleted} %`;

                if (currentCompleted >= 100) {

                    if ($scope.visID !== 'Wazuh-App-Overview-General-Agents-status') { 
                        const thereIsData   = visHandlers.hasData();

                        $rootScope.rendered = thereIsData;
                        if(!thereIsData) $rootScope.resultState = 'none';
                        else $rootScope.resultState = 'ready';
                    }
                    // Forcing a digest cycle
                    if(!$rootScope.$$phase) $rootScope.$digest();
                }
                else if ($scope.visID !== 'Wazuh-App-Overview-General-Agents-status') $rootScope.rendered = false;
            };

            // Initializing the visualization
            let loader = null;
        }
    };
}]);